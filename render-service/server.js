'use strict';

// Shared litematic render service.
//
// One headless-Chromium process that both donutbot and Donut Index call over
// loopback HTTP, so neither bot launches its own browser. It wraps the
// existing lib/litematicRender/renderer.js unchanged — that module keeps the
// warm browser, the in-flight queue, the asset server and the timeout/reset
// logic; this file only exposes it over HTTP.
//
// Runs as its own pm2 app (see ecosystem.config.js). Binds 127.0.0.1 only:
// both bots are on the same host, so no auth is needed.

const http = require('http');
const renderer = require('../lib/litematicRender/renderer');

const PORT = Number(process.env.RENDER_SERVICE_PORT) || 4123;
const HOST = '127.0.0.1';
const MAX_BODY_BYTES = 8 * 1024 * 1024; // litematic upload ceiling

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error(`body too large (> ${maxBytes} bytes)`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// POST /render — body: raw .litematic bytes; opts via query string
// (width, height, transparent=1|0, yaw). Returns { ok, png:<base64>, meta }.
async function handleRender(req, res) {
  const url = new URL(req.url, `http://${HOST}`);
  const q = url.searchParams;
  const buf = await readBody(req, MAX_BODY_BYTES);
  if (!buf.length) {
    sendJson(res, 400, { ok: false, error: 'empty body' });
    return;
  }
  const { png, meta } = await renderer.renderLitematic(buf, {
    width: Number(q.get('width')) || 1024,
    height: Number(q.get('height')) || 1024,
    transparentBackground: q.get('transparent') === '1',
    yawDegrees: Number(q.get('yaw')) || 0,
  });
  sendJson(res, 200, { ok: true, png: png.toString('base64'), meta });
}

const server = http.createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];

  if (req.method === 'GET' && path === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }
  if (req.method === 'POST' && path === '/render') {
    handleRender(req, res).catch((err) => {
      console.error('[render-service] render failed:', err.message);
      sendJson(res, 500, { ok: false, error: String(err.message || err).slice(0, 300) });
    });
    return;
  }
  sendJson(res, 404, { ok: false, error: 'not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[render-service] listening on http://${HOST}:${PORT}`);
  // Warm the browser so the first real render isn't slow. A failure here is
  // non-fatal — renderLitematic() re-runs init() on the first request.
  renderer.init().then(
    () => console.log('[render-service] renderer ready'),
    (err) => console.error('[render-service] warm-up failed (will retry on first request):', err.message),
  );
});

function shutdown() {
  console.log('[render-service] shutting down');
  server.close();
  renderer.shutdown().finally(() => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
