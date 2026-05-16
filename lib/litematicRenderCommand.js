'use strict';

const crypto = require('crypto');
const { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const RENDER_MAX_FILE_BYTES = 5 * 1024 * 1024;
const RENDER_DOWNLOAD_TIMEOUT_MS = 15 * 1000;
const RENDER_USER_COOLDOWN_MS = 30 * 1000;
const RENDER_QUEUE_MAX = 3;
const RENDER_IMAGE_SIZE = 1024;

// Rotation arrow buttons on /render replies. A render is rotated in 90° steps
// by re-rendering the original .litematic at a new camera yaw. The source
// buffer is held in memory keyed by a short token embedded in the button
// customId — only the user who ran /render may rotate, and sessions are
// evicted on a TTL so the buffers don't accumulate.
const RENDER_ROTATION_PREFIX = 'renderrot';
const RENDER_SESSION_TTL_MS = 15 * 60 * 1000;
const RENDER_SESSION_MAX = 30;
const renderSessions = new Map();

function pruneRenderSessions() {
  const now = Date.now();
  for (const [token, sess] of renderSessions) {
    if (now - sess.createdAt > RENDER_SESSION_TTL_MS) renderSessions.delete(token);
  }
  while (renderSessions.size > RENDER_SESSION_MAX) {
    const oldest = renderSessions.keys().next().value;
    if (oldest === undefined) break;
    renderSessions.delete(oldest);
  }
}

function normalizeRotation(deg) {
  return ((Math.round(Number(deg) || 0) % 360) + 360) % 360;
}

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

function buildRenderRotationRow(token) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${RENDER_ROTATION_PREFIX}:${token}:l`)
      .setLabel('Rotate ⟲')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${RENDER_ROTATION_PREFIX}:${token}:r`)
      .setLabel('Rotate ⟳')
      .setStyle(ButtonStyle.Secondary),
  );
}

function buildRenderMessage({ png, meta = {}, fileName = 'render.litematic', rotation = 0, token = null }) {
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

  // Rotation arrows only appear when a session token is supplied — the bare
  // buildRenderMessage stays component-free for non-interactive callers.
  if (token) {
    embed.setFooter({ text: `Rotation: ${normalizeRotation(rotation)}°` });
    // attachments: [] drops the prior render so a re-rotate doesn't leave a
    // stale image with the same name behind the embed.
    return { embeds: [embed], files: [attachment], attachments: [], components: [buildRenderRotationRow(token)] };
  }
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
    // Stash the source buffer so the rotation arrows can re-render it at a
    // new camera yaw without re-downloading the attachment.
    pruneRenderSessions();
    const token = crypto.randomBytes(8).toString('hex');
    renderSessions.set(token, {
      buffer: buf,
      name: file.name,
      rotation: 0,
      ownerId: interaction.user.id,
      createdAt: Date.now(),
    });
    return interaction.editReply(buildRenderMessage({ png, meta, fileName: file.name, rotation: 0, token }));
  } catch (error) {
    return interaction.editReply(`Render failed: ${String(error.message || error).slice(0, 300)}`);
  } finally {
    setInFlight(Math.max(0, getInFlight() - 1));
  }
}

// Handle a click on a /render rotation arrow. customId is
// `renderrot:<token>:<l|r>`. Only the user who ran /render may rotate; the
// reply is edited in place with the re-rendered image.
async function handleRenderRotation(interaction, deps = {}) {
  const renderLitematic = deps.renderLitematic;
  if (typeof renderLitematic !== 'function') {
    throw new Error('renderLitematic dependency is required');
  }
  const parts = String(interaction.customId || '').split(':');
  const token = parts[1];
  const dir = parts[2];
  pruneRenderSessions();
  const sess = renderSessions.get(token);
  if (!sess) {
    return interaction.reply({ content: 'This render has expired — run `/render` again.', ephemeral: true });
  }
  if (String(interaction.user.id) !== String(sess.ownerId)) {
    return interaction.reply({ content: 'Only the person who ran `/render` can rotate this.', ephemeral: true });
  }
  await interaction.deferUpdate().catch(() => {});
  sess.rotation = normalizeRotation(sess.rotation + (dir === 'l' ? -90 : 90));
  sess.createdAt = Date.now();
  try {
    const { png, meta } = await renderLitematic(sess.buffer, {
      width: RENDER_IMAGE_SIZE,
      height: RENDER_IMAGE_SIZE,
      transparentBackground: true,
      yawDegrees: sess.rotation,
    });
    return interaction.editReply(buildRenderMessage({
      png, meta, fileName: sess.name, rotation: sess.rotation, token,
    }));
  } catch (error) {
    return interaction.followUp({
      content: `Render failed: ${String(error.message || error).slice(0, 200)}`,
      ephemeral: true,
    }).catch(() => {});
  }
}

module.exports = {
  RENDER_IMAGE_SIZE,
  RENDER_ROTATION_PREFIX,
  buildRenderMessage,
  handleRenderCommand,
  handleRenderRotation,
  safeRenderName,
  schematicVolume,
};
