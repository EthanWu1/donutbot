'use strict';

const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { readLitematic } = require('./litematicReader');
const { ensureAssets, ASSET_DIR } = require('./setupAssets');

let _puppeteer = null;
function getPuppeteer() {
  if (!_puppeteer) _puppeteer = require('puppeteer');
  return _puppeteer;
}

const VIEWER_URL = pathToFileURL(path.join(__dirname, 'viewer.html')).href;

// Per-render hard timeout. A crafted schematic that hangs deepslate or WebGL
// otherwise blocks every later /render call forever.
const RENDER_TIMEOUT_MS = 60_000;
// Pending-queue cap. Beyond this, callers see a controlled failure instead
// of waiting indefinitely on a stalled chain.
const RENDER_QUEUE_CAP = 5;

let _browser = null;
let _page = null;
let _initPromise = null;
let _renderLock = Promise.resolve();
let _pending = 0;

async function init() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    await ensureAssets();
    const puppeteer = getPuppeteer();
    _browser = await puppeteer.launch({
      headless: 'new',
      // Keep ONLY flags required to make headless Chromium render WebGL via
      // ANGLE/SwiftShader for software rendering. Removed --no-sandbox,
      // --disable-setuid-sandbox, --disable-web-security, --disable-gpu-sandbox
      // — those broaden the trust boundary unnecessarily on attacker-controlled
      // input. On Windows the bundled Chromium sandbox works without them.
      // (If the host requires --no-sandbox to launch in CI/Docker, re-add
      // there explicitly; for desktop Windows the defaults are sufficient.)
      args: [
        '--enable-unsafe-swiftshader',
        '--use-angle=swiftshader',
        '--use-gl=angle',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--allow-file-access-from-files',  // narrow alt to --disable-web-security
      ],
    });
    _page = await _browser.newPage();
    _page.on('pageerror', (e) => console.error('[litematicRender] page error:', e.message));
    if (process.env.LITEMATIC_DEBUG) {
      _page.on('console', (m) => console.log('[page]', m.type(), m.text()));
    } else {
      _page.on('console', (m) => {
        if (m.type() === 'error') console.error('[litematicRender]', m.text());
      });
    }
    await _page.goto(VIEWER_URL, { waitUntil: 'load', timeout: 60_000 });
    await _page.waitForFunction(() => window.__ready === true, { timeout: 30_000 });
  })();
  return _initPromise;
}

async function shutdown() {
  try { if (_page) await _page.close(); } catch (_) {}
  try { if (_browser) await _browser.close(); } catch (_) {}
  _page = null; _browser = null; _initPromise = null;
}

// Tear down and reinit on a hung/crashed renderer so a single bad input
// doesn't poison every subsequent render.
async function resetBrowser() {
  console.warn('[litematicRender] resetting browser after timeout/crash');
  try { if (_page) await _page.close(); } catch (_) {}
  try { if (_browser) await _browser.close(); } catch (_) {}
  _page = null; _browser = null; _initPromise = null;
  await init();
}

function withTimeout(promise, ms, onTimeout) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      if (onTimeout) try { onTimeout(); } catch (_) {}
      reject(new Error(`render timeout (${ms}ms)`));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function renderLitematic(buffer, opts = {}) {
  if (_pending >= RENDER_QUEUE_CAP) {
    throw new Error(`renderer queue full (${_pending}/${RENDER_QUEUE_CAP})`);
  }
  await init();
  const width = Math.min(opts.width || 1024, 2048);
  const height = Math.min(opts.height || 1024, 2048);

  const payload = await readLitematic(buffer, { maxBlocks: opts.maxBlocks });

  _pending += 1;
  const run = _renderLock.then(async () => {
    let timedOut = false;
    try {
      const evalPromise = _page.evaluate(
        async (p, o) => window.__renderLitematic(p, o),
        payload,
        { width, height, transparentBackground: !!opts.transparentBackground }
      );
      const result = await withTimeout(evalPromise, RENDER_TIMEOUT_MS, () => { timedOut = true; });
      if (!result || !result.ok) {
        throw new Error('renderer failure: ' + (result && result.error));
      }
      const base64 = result.dataUrl.replace(/^data:image\/png;base64,/, '');
      return {
        png: Buffer.from(base64, 'base64'),
        meta: {
          name: payload.name,
          author: payload.author,
          size: payload.size,
          blockCount: payload.blockCount,
        },
        diag: result.diag,
        added: result.added,
        skipped: result.skipped,
      };
    } catch (e) {
      // Timeout or page evaluate crash → reset so we don't stall the next caller.
      if (timedOut || /Target closed|Session closed|Protocol error/i.test(e.message || '')) {
        resetBrowser().catch(() => {});
      }
      throw e;
    }
  });
  _renderLock = run.catch(() => {});
  return run.finally(() => { _pending = Math.max(0, _pending - 1); });
}

module.exports = { renderLitematic, init, shutdown, ASSET_DIR };
