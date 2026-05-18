'use strict';

// Headless HoloPrint pack generator.
//
// The vendored HoloPrint web app (render-service/holoprint/) is served over a
// loopback HTTP server and run inside headless Chromium. HoloPrint's
// makePack() reads the .mcstructure, fetches Bedrock vanilla resources over the
// network, and zips a .holoprint.mcpack. A fresh page is used per request
// (makePack mutates page state) and closed afterwards.
//
// This launches its own Chromium rather than sharing the renderer's: a
// HoloPrint failure must not destabilise the proven /render path. It is lazy —
// the browser starts only on the first /holoprint call.

const path = require('path');
const fs = require('fs');
const http = require('http');
const { getBrowserLaunchOptions } = require('../lib/litematicRender/renderer');

const HOLOPRINT_DIR = path.join(__dirname, 'holoprint');
const PACK_TIMEOUT_MS = 180_000;
const QUEUE_CAP = 3;

const STATIC_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

let _assetServer = null;
let _assetOrigin = null;

// Serves render-service/holoprint/ over loopback so Chromium can fetch the
// vendored app (file:// would hit CORS restrictions on Linux).
function startAssetServer() {
  if (_assetServer && _assetOrigin) return Promise.resolve(_assetOrigin);
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/' || urlPath === '') urlPath = '/holoprint-entry.html';
      const target = path.normalize(path.join(HOLOPRINT_DIR, urlPath));
      if (!target.startsWith(HOLOPRINT_DIR + path.sep) && target !== HOLOPRINT_DIR) {
        res.writeHead(403); res.end('forbidden'); return;
      }
      fs.stat(target, (err, stat) => {
        if (err || !stat.isFile()) { res.writeHead(404); res.end('not found'); return; }
        const ext = path.extname(target).toLowerCase();
        // Unmapped types (.lang, .material, .txt, ...) are fetched as text.
        res.setHeader('Content-Type', STATIC_MIME[ext] || 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        fs.createReadStream(target).pipe(res);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      _assetServer = server;
      _assetOrigin = `http://127.0.0.1:${server.address().port}`;
      resolve(_assetOrigin);
    });
  });
}

let _puppeteer = null;
let _browser = null;
let _browserPromise = null;
let _pending = 0;

function getPuppeteer() {
  if (!_puppeteer) _puppeteer = require('puppeteer');
  return _puppeteer;
}

async function getBrowser() {
  if (_browser && _browser.connected) return _browser;
  if (!_browserPromise) {
    _browserPromise = (async () => {
      const puppeteer = getPuppeteer();
      const opts = await getBrowserLaunchOptions();
      return puppeteer.launch(opts);
    })().catch((err) => { _browserPromise = null; throw err; });
  }
  _browser = await _browserPromise;
  return _browser;
}

async function resetBrowser() {
  try { if (_browser) await _browser.close(); } catch (_) { /* already gone */ }
  _browser = null;
  _browserPromise = null;
}

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`holoprint timeout (${ms}ms)`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

// mcstructureBuffer: a Bedrock .mcstructure. Returns { pack: Buffer, packName }.
async function makeHoloprintPack(mcstructureBuffer, sourceName) {
  if (_pending >= QUEUE_CAP) {
    throw new Error(`holoprint queue full (${_pending}/${QUEUE_CAP})`);
  }
  if (!fs.existsSync(path.join(HOLOPRINT_DIR, 'src', 'HoloPrint.js'))) {
    throw new Error('HoloPrint app is not vendored — render-service/holoprint/src is missing');
  }

  _pending += 1;
  let page = null;
  try {
    const origin = await startAssetServer();
    const browser = await getBrowser();
    page = await browser.newPage();
    page.on('pageerror', (e) => console.error('[holoprint] page error:', e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') console.error('[holoprint]', m.text());
    });

    await page.goto(`${origin}/holoprint-entry.html`, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForFunction(() => window.__ready === true, { timeout: 30_000 });

    const base = String(sourceName || 'structure').replace(/\.[^.]+$/, '') || 'structure';
    const result = await withTimeout(
      page.evaluate(
        (b64, fn) => window.__makeHoloPrint(b64, fn, {}),
        mcstructureBuffer.toString('base64'),
        `${base}.mcstructure`,
      ),
      PACK_TIMEOUT_MS,
    );
    if (!result || !result.packBase64) {
      throw new Error('HoloPrint returned no pack');
    }
    return { pack: Buffer.from(result.packBase64, 'base64'), packName: result.name };
  } catch (err) {
    if (/Target closed|Session closed|Protocol error|Connection closed/i.test(err.message || '')) {
      resetBrowser().catch(() => {});
    }
    throw err;
  } finally {
    if (page) { try { await page.close(); } catch (_) { /* page already gone */ } }
    _pending = Math.max(0, _pending - 1);
  }
}

async function shutdown() {
  try { if (_assetServer) _assetServer.close(); } catch (_) { /* not started */ }
  _assetServer = null;
  _assetOrigin = null;
  await resetBrowser();
}

module.exports = { makeHoloprintPack, shutdown };
