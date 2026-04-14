'use strict';
// ═══════════════════════════════════════════════════════════════
//  automod.js  —  Modular automod for Discord.js v14
//  Features: spam, repeated messages, invite/ad links,
//  suspicious links, word filter (bypass-aware),
//  ghost ping detection, edited message rescan, full logging.
//  Note: normal user pings are allowed and never punished here.
// ═══════════════════════════════════════════════════════════════

const { EmbedBuilder, PermissionsBitField, Events } = require('discord.js');

const AUTOMOD_EMOJI = '<:automod:1486119427102736414>';

function clipBox(text, max = 900) {
  const cleaned = String(text || '').replace(/```/g, '\`\`\`').trim();
  return cleaned ? `\`\`\`${cleaned.slice(0, max)}\`\`\`` : '\`\`\`(no text)\`\`\`';
}


function getAutomodVisual(type) {
  switch (String(type || '').toLowerCase()) {
    case 'spam':
      return { title: `${AUTOMOD_EMOJI} Spam`, color: 0xfaa61a };
    case 'repeat':
      return { title: `${AUTOMOD_EMOJI} Repeated`, color: 0xfaa61a };
    case 'invite link':
      return { title: `${AUTOMOD_EMOJI} Invite Link`, color: 0xfaa61a };
    case 'suspicious link':
      return { title: `${AUTOMOD_EMOJI} Suspicious Link`, color: 0xfaa61a };
    case 'word filter':
      return { title: `${AUTOMOD_EMOJI} Word Filter`, color: 0xfaa61a };
    default:
      return { title: `${AUTOMOD_EMOJI} Filtered`, color: 0xfaa61a };
  }
}

// ── Default thresholds (overridden by /set automod_* commands stored in DB) ──
const DEFAULTS = {
  enabled:          true,
  spam_limit:       4,         // messages within spam_window before action
  spam_window_ms:   3500,      // rolling window for spam (ms)
  spam_cooldown_ms: 20000,     // min gap between consecutive spam punishments
  repeat_limit:     2,         // same-message count before action
  repeat_window_ms: 7000,
  mention_limit:    5,         // kept for config compatibility; not enforced
  warn_threshold:   2,         // infractions before timeout escalates
  // Timeouts in ms: infraction count → timeout
  timeout_1: 60_000,           // 1 min
  timeout_2: 300_000,          // 5 min
  timeout_3: 600_000,          // 10 min
  timeout_4: 3_600_000,        // 1 hour
  log_channel_id: null,        // set via /set automod_log_channel
};

// ── Suspicious / ad link patterns ─────────────────────────────────────────────
const AD_PATTERNS = [
  /discord\.gg\//i,
  /discordapp\.com\/invite\//i,
  /discord\.com\/invite\//i,
];

const SUSPICIOUS_PATTERNS = [
  /bit\.ly\//i,
  /tinyurl\.com\//i,
  /grabify\.link/i,
  /iplogger\./i,
  /discord-app\./i,
  /discorde\.gg/i,
  /discordnitro\./i,
  /free-nitro\./i,
  /steamcommunlty\./i,  // typosquatting steam
];

// Word filter — add entries to the DB via /set automod_words
// Normalisation strips common bypass tricks before matching
function normaliseText(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFKC')
    // l33t → letter
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
    .replace(/8/g, 'b').replace(/@/g, 'a').replace(/\$/g, 's')
    // strip non-alphanumeric noise
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(.)\1{2,}/g, '$1')  // "heeello" → "helo"
    .trim();
}

// Strip real Discord mention tokens before word-filter scanning
function stripMentions(s) {
  return String(s)
    .replace(/<@[!&]?\d+>/g, ' ')
    .replace(/@everyone/gi, ' ')
    .replace(/@here/gi, ' ');
}

function isMentionLikeBlockedWord(word) {
  const w = String(word || '').trim();
  return /^<@[!&]?\d+>$/.test(w) || /^\d{16,20}$/.test(w) || /^@(?:everyone|here)$/i.test(w);
}

// ── Per-server in-memory state ─────────────────────────────────────────────────
const spamTracker   = new Map();
const spamCooldown  = new Map();
const repeatTracker = new Map();
const recentDeletes = new Map(); // messageId → { authorId, mentions, ts, channelId }

// ── Helper: get merged config (DB overrides DEFAULTS) ─────────────────────────
async function getConfig(store, guildId) {
  const saved = await store.getAutomodConfig(guildId).catch(() => null);
  return { ...DEFAULTS, ...(saved || {}) };
}

// ── Helper: is this member exempt? ────────────────────────────────────────────
function isExempt(member, cfg) {
  if (!member) return false;
  if (member.permissions?.has(PermissionsBitField.Flags.ManageMessages)) return true;
  if (member.permissions?.has(PermissionsBitField.Flags.Administrator)) return true;
  const exemptRoles = cfg.exempt_role_ids || [];
  if (exemptRoles.some(rid => member.roles.cache.has(rid))) return true;
  return false;
}

// ── Helper: is this channel exempt? ───────────────────────────────────────────
function isChannelExempt(channel, cfg) {
  const exemptChannels = cfg.exempt_channel_ids || [];
  return exemptChannels.includes(channel.id) ||
    (channel.parentId && exemptChannels.includes(channel.parentId));
}

// ── Core action: warn/timeout + log ───────────────────────────────────────────
async function enforce(message, type, reason, cfg, store) {
  try {
    const { guild, author, member } = message;
    if (!guild || !member) return;

    if (message.deletable) await message.delete().catch(() => {});

    const count = await store.addInfraction(author.id, guild.id, type).catch(() => 1);

    let timeoutMs = cfg.timeout_1;
    if (count >= 4) timeoutMs = cfg.timeout_4;
    else if (count >= 3) timeoutMs = cfg.timeout_3;
    else if (count >= 2) timeoutMs = cfg.timeout_2;

    const durationLabel = fmtMs(timeoutMs);

    try {
      await author.send({ content: `You were moderated in **${guild.name}** for **${type}** — ${reason}. Timeout: **${durationLabel}**.` }).catch(() => {});
    } catch {}

    if (member.moderatable) {
      await member.timeout(timeoutMs, `AutoMod: ${type} (${count}x)`).catch(() => {});
    }

    await logAction(guild, type, author, reason, count, message, cfg, store);
  } catch (e) {
    console.error('[AutoMod] enforce error:', e);
  }
}

async function logAction(guild, type, user, reason, count, message, cfg, store) {
  try {
    const logChId = cfg.log_channel_id || await store.getConfigValue(guild.id, 'CHANNEL_MOD_LOG').catch(() => null);
    if (!logChId) return;
    const ch = await guild.channels.fetch(logChId).catch(() => null);
    if (!ch || !ch.isTextBased()) return;
    const visual = getAutomodVisual(type);
    const eb = new EmbedBuilder()
      .setColor(visual.color)
      .setTitle(visual.title)
      .setDescription(`**User:** ${user}
**Infractions:** ${count}${message?.channelId ? `
**Channel:** <#${message.channelId}>` : ''}`)
      .addFields({ name: 'Message Content', value: clipBox(message?.content) })
      .setTimestamp();
    await ch.send({ embeds: [eb] }).catch(() => {});
  } catch {}
}



function hasFloodContent(content) {
  const text = String(content || '');
  if (!text) return false;
  const lines = text.split(/\n+/).filter(Boolean);
  if (lines.length >= 8) return true;
  const urls = text.match(/https?:\/\//gi) || [];
  if (urls.length >= 3) return true;
  const emojiRuns = text.match(/<a?:\w+:\d+>|[\u{1F300}-\u{1FAFF}]/gu) || [];
  if (emojiRuns.length >= 10) return true;
  const mentions = text.match(/<@!?\d+>|<@&\d+>|@everyone|@here/gi) || [];
  if (mentions.length >= 4) return true;
  return false;
}

function fmtMs(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s/60)}m`;
  return `${Math.round(s/3600)}h`;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN MESSAGE HANDLER — call this from messageCreate once
// ══════════════════════════════════════════════════════════════════════════════
async function handleMessage(message, store) {
  if (!message.guild || message.author?.bot) return;

  const cfg = await getConfig(store, message.guild.id);
  if (!cfg.enabled) return;
  if (isChannelExempt(message.channel, cfg)) return;

  const member = message.member ||
    await message.guild.members.fetch(message.author.id).catch(() => null);
  if (isExempt(member, cfg)) return;

  const content = message.content || '';
  const now = Date.now();
  const userId = message.author.id;

  // 1 ── Spam detection ───────────────────────────────────────────────────────
  const spamBuf = (spamTracker.get(userId) || []).filter(t => now - t < cfg.spam_window_ms);
  spamBuf.push(now);
  spamTracker.set(userId, spamBuf);

  if (spamBuf.length > cfg.spam_limit) {
    const lastPunish = spamCooldown.get(userId) || 0;
    if (now - lastPunish > cfg.spam_cooldown_ms) {
      spamCooldown.set(userId, now);
      spamTracker.set(userId, []);
      try {
        const fetched = await message.channel.messages.fetch({ limit: 20 });
        const toDelete = fetched.filter(m => m.author.id === userId && now - m.createdTimestamp < 10000);
        await message.channel.bulkDelete(toDelete, true).catch(() => {});
      } catch {}
      await enforce(message, 'Spam', 'stop spamming', cfg, store);
      return;
    }
  }

  // 2 ── Repeated message detection ──────────────────────────────────────────
  const repeatKey = `${userId}:${message.channelId}`;
  const norm = normaliseText(content);
  if (norm.length > 4) {
    const prev = repeatTracker.get(repeatKey);
    if (prev && prev.text === norm && now - prev.firstSeen < cfg.repeat_window_ms) {
      prev.count++;
      repeatTracker.set(repeatKey, prev);
      if (prev.count >= cfg.repeat_limit) {
        repeatTracker.delete(repeatKey);
        await enforce(message, 'Repeat', 'stop repeating the same message', cfg, store);
        return;
      }
    } else {
      repeatTracker.set(repeatKey, { text: norm, count: 1, firstSeen: now });
    }
  }

  // 3 ── Mentions are allowed; only tracked below for ghost-ping logging.

  // 3.5 ── Flood / wall-of-text / emoji burst detection ─────────────────────
  if (hasFloodContent(content)) {
    await enforce(message, 'Spam', 'stop flooding the chat', cfg, store);
    return;
  }

  // 4 ── Invite / ad link filtering ──────────────────────────────────────────
  if (AD_PATTERNS.some(p => p.test(content))) {
    await enforce(message, 'Invite Link', 'no invite links in this server', cfg, store);
    return;
  }

  // 5 ── Suspicious link filtering ───────────────────────────────────────────
  if (SUSPICIOUS_PATTERNS.some(p => p.test(content))) {
    await enforce(message, 'Suspicious Link', 'suspicious/phishing link detected', cfg, store);
    return;
  }

  // 6 ── Word filter ──────────────────────────────────────────────────────────
  const blockedWords = (cfg.blocked_words || []).filter(w => !isMentionLikeBlockedWord(w));
  if (blockedWords.length) {
    // Remove real mention tokens before scanning so pings never trip the word filter.
    const scanText = normaliseText(stripMentions(content));
    if (scanText.length) {
      const hit = blockedWords.find(w => {
        const candidate = normaliseText(stripMentions(w));
        return candidate && scanText.includes(candidate);
      });
      if (hit) {
        await enforce(message, 'Word Filter', 'blocked word detected', cfg, store);
        return;
      }
    }
  }

  // 7 ── Track mentions for ghost-ping detection ─────────────────────────────
  if (message.mentions.users.size > 0) {
    const ids = [...message.mentions.users.keys()];
    recentDeletes.set(message.id, { authorId: userId, mentions: ids, ts: now, channelId: message.channelId });
    setTimeout(() => recentDeletes.delete(message.id), 10000);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MESSAGE DELETE — ghost ping detection
// ══════════════════════════════════════════════════════════════════════════════
async function handleMessageDelete(message, store) {
  if (!message.guild || message.author?.bot) return;
  const tracked = recentDeletes.get(message.id);
  if (!tracked || tracked.mentions.length === 0) return;
  recentDeletes.delete(message.id);

  const cfg = await getConfig(store, message.guild.id);
  if (!cfg.enabled || !cfg.ghost_ping_enabled) return;

  const member = await message.guild.members.fetch(tracked.authorId).catch(() => null);
  if (isExempt(member, cfg)) return;

  const logChId = cfg.log_channel_id || await store.getConfigValue(message.guild.id, 'CHANNEL_MOD_LOG').catch(() => null);
  if (!logChId) return;
  const ch = await message.guild.channels.fetch(logChId).catch(() => null);
  if (!ch) return;

  const mentionText = tracked.mentions.map(id => `<@${id}>`).join(', ');
  await ch.send({
    embeds: [new EmbedBuilder()
      .setColor(0xfaa61a)
      .setTitle(`${AUTOMOD_EMOJI} Ghost Ping`)
      .setDescription(`**User:** <@${tracked.authorId}>
**Mentioned:** ${mentionText}
**Channel:** <#${tracked.channelId}>
**Message was deleted within 10s of being sent.**`)
      .addFields({ name: 'Message Content', value: clipBox(message?.content) })
      .setTimestamp()
    ]
  }).catch(() => {});
}

// ══════════════════════════════════════════════════════════════════════════════
// MESSAGE UPDATE — rescan edited messages
// ══════════════════════════════════════════════════════════════════════════════
async function handleMessageUpdate(oldMsg, newMsg, store) {
  if (!newMsg.guild || newMsg.author?.bot) return;
  if (oldMsg.content === newMsg.content) return;
  await handleMessage(newMsg, store);
}

// ══════════════════════════════════════════════════════════════════════════════
// REGISTER ALL LISTENERS  — call once from index.js
// ══════════════════════════════════════════════════════════════════════════════
function register(client, store) {
  client.on(Events.MessageCreate, m => handleMessage(m, store).catch(() => {}));
  client.on(Events.MessageDelete, m => handleMessageDelete(m, store).catch(() => {}));
  client.on(Events.MessageUpdate, (o, n) => handleMessageUpdate(o, n, store).catch(() => {}));
  console.log('[AutoMod] Registered message listeners.');
}

module.exports = { register, handleMessage, handleMessageDelete, handleMessageUpdate, normaliseText };
