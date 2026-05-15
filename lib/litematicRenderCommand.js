'use strict';

const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

const RENDER_MAX_FILE_BYTES = 5 * 1024 * 1024;
const RENDER_DOWNLOAD_TIMEOUT_MS = 15 * 1000;
const RENDER_USER_COOLDOWN_MS = 30 * 1000;
const RENDER_QUEUE_MAX = 3;
const RENDER_IMAGE_SIZE = 1024;

function formatCount(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function schematicVolume(size) {
  if (!size) return 0;
  return Math.max(0, Number(size.x || 0))
       * Math.max(0, Number(size.y || 0))
       * Math.max(0, Number(size.z || 0));
}

function safeRenderName(name) {
  const base = String(name || 'render')
    .replace(/\.litematic$/i, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return `${base || 'render'}-render.png`;
}

function buildRenderMessage({ png, meta = {}, fileName = 'render.litematic' }) {
  const size = meta.size || { x: 0, y: 0, z: 0 };
  const volume = schematicVolume(size);
  const title = meta.name || fileName || 'Litematic Render';
  const attachment = new AttachmentBuilder(png, {
    name: safeRenderName(title),
  });
  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(title)
    .addFields(
      {
        name: 'Volume',
        value: `\`${formatCount(meta.blockCount)}/${formatCount(volume)}\``,
        inline: true,
      },
      {
        name: 'Size',
        value: `\`${formatCount(size.x)} x ${formatCount(size.y)} x ${formatCount(size.z)}\``,
        inline: true,
      }
    )
    .setImage(`attachment://${attachment.name}`);

  return { embeds: [embed], files: [attachment] };
}

async function fetchAttachmentBuffer(file, fetchImpl, timeoutMs, maxBytes) {
  const ac = new AbortController();
  const timeoutId = setTimeout(() => ac.abort(), timeoutMs);
  let res;
  try {
    res = await fetchImpl(file.url, { signal: ac.signal });
  } finally {
    clearTimeout(timeoutId);
  }
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);

  const declared = parseInt(res.headers?.get?.('content-length') || '0', 10);
  if (declared && declared > maxBytes) {
    throw new Error(`file too large: ${declared} bytes`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) {
    throw new Error(`file too large after download: ${buf.length} bytes`);
  }
  return buf;
}

function getOptionalAttachment(options, name) {
  try {
    return options.getAttachment(name, false) || null;
  } catch (_) {
    return null;
  }
}

function getRenderAttachment(interaction) {
  return getOptionalAttachment(interaction.options, 'litematic')
      || getOptionalAttachment(interaction.options, 'file');
}

async function handleRenderCommand(interaction, deps = {}) {
  const file = getRenderAttachment(interaction);
  const maxBytes = deps.maxBytes || RENDER_MAX_FILE_BYTES;
  const cooldownMs = deps.cooldownMs || RENDER_USER_COOLDOWN_MS;
  const queueMax = deps.queueMax || RENDER_QUEUE_MAX;
  const timeoutMs = deps.timeoutMs || RENDER_DOWNLOAD_TIMEOUT_MS;
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const renderLitematic = deps.renderLitematic;
  if (typeof renderLitematic !== 'function') {
    throw new Error('renderLitematic dependency is required');
  }

  if (!file) {
    return interaction.reply({ content: 'Attach a `.litematic` file to render.', ephemeral: true });
  }

  const cooldowns = deps.cooldowns || (global.__renderCooldowns ||= new Map());
  const getInFlight = deps.getInFlight || (() => global.__renderInFlight || 0);
  const setInFlight = deps.setInFlight || ((n) => { global.__renderInFlight = n; });

  const now = Date.now();
  const lastAt = cooldowns.get(interaction.user.id) || 0;
  if (now - lastAt < cooldownMs) {
    const remain = Math.ceil((cooldownMs - (now - lastAt)) / 1000);
    return interaction.reply({ content: `Please wait ${remain}s before another render.`, ephemeral: true });
  }
  if (getInFlight() >= queueMax) {
    return interaction.reply({ content: `Renderer busy (${queueMax} in flight). Try again shortly.`, ephemeral: true });
  }

  await interaction.deferReply();

  if (!/\.litematic$/i.test(file.name || '')) {
    return interaction.editReply('Attachment must be a `.litematic` file.');
  }
  if (typeof file.size === 'number' && file.size > maxBytes) {
    return interaction.editReply(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${Math.floor(maxBytes / 1024 / 1024)} MB.`);
  }

  cooldowns.set(interaction.user.id, now);
  setInFlight(getInFlight() + 1);
  try {
    const buf = await fetchAttachmentBuffer(file, fetchImpl, timeoutMs, maxBytes);
    const { png, meta } = await renderLitematic(buf, {
      width: RENDER_IMAGE_SIZE,
      height: RENDER_IMAGE_SIZE,
      transparentBackground: true,
    });
    return interaction.editReply(buildRenderMessage({ png, meta, fileName: file.name }));
  } catch (error) {
    return interaction.editReply(`Render failed: ${String(error.message || error).slice(0, 300)}`);
  } finally {
    setInFlight(Math.max(0, getInFlight() - 1));
  }
}

module.exports = {
  RENDER_IMAGE_SIZE,
  buildRenderMessage,
  handleRenderCommand,
  safeRenderName,
  schematicVolume,
};
