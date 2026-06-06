'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  attachmentDownloadCandidates,
  downloadToBuffer,
} = require('../lib/attachmentDownload');

test('attachment download candidates include proxy URLs without duplicates', () => {
  assert.deepEqual(attachmentDownloadCandidates({
    url: 'https://cdn.example/file.litematic',
    proxyURL: 'https://media.example/file.litematic',
    proxyUrl: 'https://media.example/file.litematic',
  }), [
    'https://cdn.example/file.litematic',
    'https://media.example/file.litematic',
  ]);
});

test('downloadToBuffer falls back from expired CDN URL to attachment proxy', async () => {
  const calls = [];
  const buf = await downloadToBuffer({
    url: 'https://cdn.example/expired.litematic',
    proxyURL: 'https://media.example/live.litematic',
  }, {
    fetchImpl: async (url) => {
      calls.push(url);
      if (url.includes('expired')) {
        return { ok: false, status: 403, async arrayBuffer() { return Buffer.from(''); } };
      }
      return { ok: true, status: 200, async arrayBuffer() { return Buffer.from('litematic'); } };
    },
  });

  assert.equal(buf.toString(), 'litematic');
  assert.deepEqual(calls, [
    'https://cdn.example/expired.litematic',
    'https://media.example/live.litematic',
  ]);
});
