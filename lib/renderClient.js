'use strict';

// HTTP client for the shared render service (render-service/server.js).
//
// renderLitematic() has the SAME signature and return shape as
// lib/litematicRender/renderer.js's renderLitematic — { png: Buffer, meta } —
// so call sites swap one require() and nothing else changes. The heavy
// puppeteer/Chromium stack lives only in the render-service process.

const RENDER_SERVICE_URL = process.env.RENDER_SERVICE_URL || 'http://127.0.0.1:4123';
const REQUEST_TIMEOUT_MS = 90_000;

async function renderLitematic(buffer, opts = {}) {
  const params = new URLSearchParams({
    width: String(opts.width || 1024),
    height: String(opts.height || 1024),
    transparent: opts.transparentBackground ? '1' : '0',
    yaw: String(Number(opts.yawDegrees) || 0),
  });

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${RENDER_SERVICE_URL}/render?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buffer,
      signal: ac.signal,
    });
  } catch (err) {
    throw new Error(
      `render service unreachable at ${RENDER_SERVICE_URL} — `
      + `is the render-service pm2 app running? (${err.message})`,
    );
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || !data.ok) {
    throw new Error(`render service error: ${(data && data.error) || `HTTP ${res.status}`}`);
  }
  return { png: Buffer.from(data.png, 'base64'), meta: data.meta };
}

module.exports = { renderLitematic, RENDER_SERVICE_URL };
