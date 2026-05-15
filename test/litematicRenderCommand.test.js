'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildRenderMessage,
  handleRenderCommand,
} = require('../lib/litematicRenderCommand');

test('builds render embed with volume, size, and attached transparent image', () => {
  const message = buildRenderMessage({
    png: Buffer.from('png'),
    fileName: 'EtZ Kelp T2.3 NEW.litematic',
    meta: {
      name: 'EtZ Kelp T2.3 NEW',
      author: 'iEtZ',
      size: { x: 55, y: 22, z: 29 },
      blockCount: 24899,
    },
  });

  assert.equal(message.embeds.length, 1);
  assert.equal(message.files.length, 1);

  const embed = message.embeds[0].toJSON();
  assert.equal(embed.title, 'EtZ Kelp T2.3 NEW');
  assert.deepEqual(embed.fields, [
    { name: 'Volume', value: '`24,899/35,090`', inline: true },
    { name: 'Size', value: '`55 x 22 x 29`', inline: true },
  ]);
  assert.equal(embed.image.url, `attachment://${message.files[0].name}`);
  assert.match(message.files[0].name, /^EtZ_Kelp_T2_3_NEW-render\.png$/);
});

test('render command renders litematic attachment with transparent background option', async () => {
  const calls = [];
  const interaction = {
    user: { id: 'user-1' },
    options: {
      getAttachment(name, required) {
        calls.push(['getAttachment', name, required]);
        return {
          name: 'farm.litematic',
          size: 12,
          url: 'https://cdn.example/farm.litematic',
        };
      },
    },
    async deferReply() { calls.push(['deferReply']); },
    async editReply(payload) { calls.push(['editReply', payload]); },
  };
  const fetchImpl = async (url, opts) => {
    calls.push(['fetch', url, !!opts.signal]);
    return {
      ok: true,
      headers: { get: () => '12' },
      async arrayBuffer() { return Buffer.from('litematic'); },
    };
  };
  const renderLitematic = async (buf, opts) => {
    calls.push(['render', Buffer.isBuffer(buf), opts]);
    return {
      png: Buffer.from('png'),
      meta: {
        name: 'Farm',
        author: '',
        size: { x: 2, y: 3, z: 4 },
        blockCount: 17,
      },
    };
  };

  await handleRenderCommand(interaction, {
    fetchImpl,
    renderLitematic,
    cooldowns: new Map(),
    getInFlight: () => 0,
    setInFlight: () => {},
  });

  assert.deepEqual(calls[0], ['getAttachment', 'litematic', true]);
  assert.deepEqual(calls[1], ['deferReply']);
  assert.deepEqual(calls[2], ['fetch', 'https://cdn.example/farm.litematic', true]);
  assert.deepEqual(calls[3], ['render', true, { width: 1024, height: 1024, transparentBackground: true }]);

  const reply = calls.at(-1);
  assert.equal(reply[0], 'editReply');
  const embed = reply[1].embeds[0].toJSON();
  assert.equal(embed.fields[0].value, '`17/24`');
  assert.equal(embed.fields[1].value, '`2 x 3 x 4`');
  assert.equal(embed.image.url, `attachment://${reply[1].files[0].name}`);
});

test('render command rejects non-litematic attachments', async () => {
  let rendered = false;
  const interaction = {
    user: { id: 'user-1' },
    options: {
      getAttachment() {
        return { name: 'farm.zip', size: 12, url: 'https://cdn.example/farm.zip' };
      },
    },
    async deferReply() {},
    async editReply(payload) {
      assert.equal(payload, 'Attachment must be a `.litematic` file.');
    },
  };

  await handleRenderCommand(interaction, {
    fetchImpl: async () => { throw new Error('should not fetch'); },
    renderLitematic: async () => { rendered = true; },
    cooldowns: new Map(),
    getInFlight: () => 0,
    setInFlight: () => {},
  });

  assert.equal(rendered, false);
});
