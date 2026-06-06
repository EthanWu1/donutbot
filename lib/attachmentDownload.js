'use strict';

function attachmentDownloadCandidates(source) {
  const out = [];
  const add = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      for (const item of value) add(item);
      return;
    }
    if (typeof value === 'string') {
      out.push(value);
      return;
    }
    if (typeof value === 'object') {
      add(value.url);
      add(value.proxyURL);
      add(value.proxyUrl);
      add(value.proxy_url);
      add(value.attachment);
    }
  };
  add(source);
  return out.filter((url, idx, arr) => arr.indexOf(url) === idx);
}

async function downloadToBuffer(source, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('fetch is unavailable');

  const urls = attachmentDownloadCandidates(source);
  let lastError = null;
  for (const url of urls) {
    try {
      const res = await fetchImpl(url);
      if (!res.ok) {
        lastError = new Error(`download ${url}: ${res.status}`);
        continue;
      }
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('download failed: no URL available');
}

module.exports = {
  attachmentDownloadCandidates,
  downloadToBuffer,
};
