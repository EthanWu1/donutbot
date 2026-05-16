'use strict';

const path = require('path');
const fs = require('fs');
const http = require('http');
const { readLitematic } = require('./litematicReader');
const { ensureAssets, ASSET_DIR } = require('./setupAssets');

let _puppeteer = null;
function getPuppeteer() {
  if (!_puppeteer) _puppeteer = require('puppeteer');
  return _puppeteer;
}

// Serve viewer.html and its sibling assets over a loopback HTTP server.
// Using http://127.0.0.1 instead of file:// avoids headless-Chromium's
// CORS / "Failed to fetch" restriction on file:// → file:// fetches on Linux.
let _assetServer = null;
let _assetServerOrigin = null;

const STATIC_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.css':  'text/css; charset=utf-8',
};

function startAssetServer() {
  if (_assetServer && _assetServerOrigin) return Promise.resolve(_assetServerOrigin);
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // Strip query string and resolve relative to __dirname. Prevent
      // path traversal — only files under __dirname are served.
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/' || urlPath === '') urlPath = '/viewer.html';
      const target = path.normalize(path.join(__dirname, urlPath));
      if (!target.startsWith(__dirname + path.sep) && target !== __dirname) {
        res.writeHead(403); res.end('forbidden'); return;
      }
      fs.stat(target, (err, stat) => {
        if (err || !stat.isFile()) { res.writeHead(404); res.end('not found'); return; }
        const ext = path.extname(target).toLowerCase();
        res.setHeader('Content-Type', STATIC_MIME[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-store');
        fs.createReadStream(target).pipe(res);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      _assetServer = server;
      _assetServerOrigin = `http://127.0.0.1:${port}`;
      resolve(_assetServerOrigin);
    });
  });
}

function stopAssetServer() {
  return new Promise((resolve) => {
    if (!_assetServer) { _assetServerOrigin = null; return resolve(); }
    _assetServer.close(() => { _assetServer = null; _assetServerOrigin = null; resolve(); });
  });
}

const RENDER_TIMEOUT_MS = 60_000;
const RENDER_QUEUE_CAP = 5;

const BASE_CHROME_ARGS = [
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
  '--use-gl=angle',
  '--enable-webgl',
  '--ignore-gpu-blocklist',
  // Kept for legacy fallbacks; the renderer now serves viewer.html over
  // 127.0.0.1, so file:// CORS is no longer in the hot path.
  '--allow-file-access-from-files',
];

const LINUX_CONTAINER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
];

let _browser = null;
let _page = null;
let _initPromise = null;
let _renderLock = Promise.resolve();
let _pending = 0;

function uniqueArgs(...argLists) {
  return [...new Set(argLists.flat().filter(Boolean))];
}

function configuredBrowserPaths(env) {
  return [
    env.CHROME_EXECUTABLE_PATH,
    env.PUPPETEER_EXECUTABLE_PATH,
    env.CHROMIUM_PATH,
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean);
}

async function getBrowserLaunchOptions({
  platform = process.platform,
  env = process.env,
  fileExists = (p) => fs.existsSync(p),
  chromiumModule,
} = {}) {
  const isLinux = platform === 'linux';
  const linuxArgs = isLinux ? LINUX_CONTAINER_ARGS : [];

  for (const executablePath of configuredBrowserPaths(env)) {
    if (fileExists(executablePath)) {
      return {
        headless: 'new',
        executablePath,
        args: uniqueArgs(BASE_CHROME_ARGS, linuxArgs),
      };
    }
  }

  if (isLinux) {
    const chromium = chromiumModule || require('@sparticuz/chromium');
    const executablePath = await chromium.executablePath();
    return {
      headless: chromium.headless ?? true,
      executablePath,
      args: uniqueArgs(chromium.args || [], BASE_CHROME_ARGS, linuxArgs),
    };
  }

  return {
    headless: 'new',
    args: BASE_CHROME_ARGS,
  };
}

function explainBrowserLaunchFailure(error) {
  const message = error && error.message ? error.message : String(error);
  if (/error while loading shared libraries|libatk-1\.0\.so\.0|libnss3|libx11|libxcomposite/i.test(message)) {
    return new Error(
      'Render failed to launch Chromium because the host is missing native browser libraries. ' +
      'The renderer uses packaged @sparticuz/chromium on Linux by default; if this persists, ' +
      'set CHROME_EXECUTABLE_PATH or PUPPETEER_EXECUTABLE_PATH to a working browser. Original error: ' +
      message
    );
  }
  return error;
}

async function init() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    await ensureAssets();
    const origin = await startAssetServer();
    const puppeteer = getPuppeteer();
    const launchOptions = await getBrowserLaunchOptions();
    try {
      _browser = await puppeteer.launch(launchOptions);
    } catch (error) {
      throw explainBrowserLaunchFailure(error);
    }

    _page = await _browser.newPage();
    _page.on('pageerror', (e) => console.error('[litematicRender] page error:', e.message));
    if (process.env.LITEMATIC_DEBUG) {
      _page.on('console', (m) => console.log('[page]', m.type(), m.text()));
    } else {
      _page.on('console', (m) => {
        if (m.type() === 'error') console.error('[litematicRender]', m.text());
      });
    }
    await _page.goto(`${origin}/viewer.html`, { waitUntil: 'load', timeout: 60_000 });
    await _page.waitForFunction(() => window.__ready === true, { timeout: 30_000 });
  })().catch((error) => {
    _initPromise = null;
    throw error;
  });
  return _initPromise;
}

async function shutdown() {
  try { if (_page) await _page.close(); } catch (_) {}
  try { if (_browser) await _browser.close(); } catch (_) {}
  try { await stopAssetServer(); } catch (_) {}
  _page = null; _browser = null; _initPromise = null;
}

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

function buildStaticRenderPayload(payload) {
  return {
    ...payload,
    entities: [],
    entityCount: 0,
    sourceEntityCount: payload?.entityCount || 0,
  };
}

async function renderLitematic(buffer, opts = {}) {
  if (_pending >= RENDER_QUEUE_CAP) {
    throw new Error(`renderer queue full (${_pending}/${RENDER_QUEUE_CAP})`);
  }
  await init();
  const width = Math.min(opts.width || 1024, 2048);
  const height = Math.min(opts.height || 1024, 2048);

  const payload = await readLitematic(buffer, { maxBlocks: opts.maxBlocks });
  const renderPayload = buildStaticRenderPayload(payload);

  _pending += 1;
  const run = _renderLock.then(async () => {
    let timedOut = false;
    try {
      const evalPromise = _page.evaluate(
        async (p, o) => window.__renderLitematic(p, o),
        renderPayload,
        {
          width,
          height,
          transparentBackground: !!opts.transparentBackground,
          yawDegrees: Number(opts.yawDegrees) || 0,
        }
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
          entityCount: 0,
          sourceEntityCount: payload.entityCount || 0,
        },
        diag: result.diag,
        added: result.added,
        skipped: result.skipped,
        entityCount: result.entityCount || 0,
      };
    } catch (error) {
      if (timedOut || /Target closed|Session closed|Protocol error/i.test(error.message || '')) {
        resetBrowser().catch(() => {});
      }
      throw error;
    }
  });
  _renderLock = run.catch(() => {});
  return run.finally(() => { _pending = Math.max(0, _pending - 1); });
}

module.exports = {
  renderLitematic,
  buildStaticRenderPayload,
  init,
  shutdown,
  ASSET_DIR,
  getBrowserLaunchOptions,
};
