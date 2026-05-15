'use strict';

const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

const PREVIEW_MAX_FILE_BYTES = 5 * 1024 * 1024;
const PREVIEW_DOWNLOAD_TIMEOUT_MS = 15 * 1000;
const PREVIEW_USER_COOLDOWN_MS = 30 * 1000;
const PREVIEW_QUEUE_MAX = 3;
const PREVIEW_RENDER_SIZE = 1024;

function formatCount(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function schematicVolume(size) {
  if (!size) return 0;
  return Math.max(0, Number(size.x || 0))
       * Math.max(0, Number(size.y || 0))
       * Math.max(0, Number(size.z || 0));
}

function safePreviewName(name) {
  const base = String(name || 'preview')
    .replace(/\.litematic$/i, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return `${base || 'preview'}-preview.png`;
}

function buildPreviewMessage({ png, meta = {}, fileName = 'preview.litematic' }) {
  const size = meta.size || { x: 0, y: 0, z: 0 };
  const volume = schematicVolume(size);
  const title = meta.name || fileName || 'Litematic Preview';
  const attachment = new AttachmentBuilder(png, {
    name: safePreviewName(title),
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

async function handlePreviewCommand(interaction, deps = {}) {
  const file = interaction.options.getAttachment('litematic', true);
  const maxBytes = deps.maxBytes || PREVIEW_MAX_FILE_BYTES;
  const cooldownMs = deps.cooldownMs || PREVIEW_USER_COOLDOWN_MS;
  const queueMax = deps.queueMax || PREVIEW_QUEUE_MAX;
  const timeoutMs = deps.timeoutMs || PREVIEW_DOWNLOAD_TIMEOUT_MS;
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const renderLitematic = deps.renderLitematic;
  if (typeof renderLitematic !== 'function') {
    throw new Error('renderLitematic dependency is required');
  }

  const cooldowns = deps.cooldowns || (global.__previewCooldowns ||= new Map());
  const getInFlight = deps.getInFlight || (() => global.__previewInFlight || 0);
  const setInFlight = deps.setInFlight || ((n) => { global.__previewInFlight = n; });

  const now = Date.now();
  const lastAt = cooldowns.get(interaction.user.id) || 0;
  if (now - lastAt < cooldownMs) {
    const remain = Math.ceil((cooldownMs - (now - lastAt)) / 1000);
    return interaction.reply({ content: `Please wait ${remain}s before another preview.`, ephemeral: true });
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
      width: PREVIEW_RENDER_SIZE,
      height: PREVIEW_RENDER_SIZE,
      transparentBackground: true,
    });
    return interaction.editReply(buildPreviewMessage({ png, meta, fileName: file.name }));
  } catch (e) {
    return interaction.editReply(`Preview failed: ${String(e.message || e).slice(0, 300)}`);
  } finally {
    setInFlight(Math.max(0, getInFlight() - 1));
  }
}

module.exports = {
  PREVIEW_RENDER_SIZE,
  buildPreviewMessage,
  handlePreviewCommand,
  safePreviewName,
  schematicVolume,
};
