'use strict';
const { AuditLogEvent, ChannelType, EmbedBuilder, PermissionsBitField, Events } = require('discord.js');
const C = require('./config');
const { isAntiNukeExemptMember } = require('./botLogic');

const state = {
  joins: new Map(),
  actions: new Map(),
  raidMode: new Map(),
};

const CFG = {
  joinWindowMs: 5000,
  alertJoins: 5,
  lockJoins: 10,
  nukeWindowMs: 10000,
  channelDeleteLimit: 3,
  roleDeleteLimit: 2,
  rolePermEditLimit: 2,
  channelPermEditLimit: 3,
  newAccountMs: 3 * 24 * 60 * 60 * 1000,
  spamMsgLimit: 7,
  spamWindowMs: 4000,
};

async function getAntiRaidConfig(store, guildId) {
  const raw = await store.getConfigValue(guildId, 'ANTIRAID_CONFIG').catch(() => null);
  let saved = {};
  if (raw) {
    try { saved = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { saved = {}; }
  }
  return {
    mode: saved.mode || 'watch',
    whitelist: {
      users: Array.isArray(saved.whitelist?.users) ? saved.whitelist.users.map(String) : [],
      roles: Array.isArray(saved.whitelist?.roles) ? saved.whitelist.roles.map(String) : [],
      channels: Array.isArray(saved.whitelist?.channels) ? saved.whitelist.channels.map(String) : [],
    },
    thresholds: { ...(saved.thresholds || {}) },
  };
}

function isWhitelistedMember(member, cfg) {
  if (!member) return false;
  if (cfg.whitelist.users.includes(String(member.id))) return true;
  return cfg.whitelist.roles.some(rid => member.roles?.cache?.has?.(rid));
}

function threshold(cfg, key) {
  const value = Number(cfg.thresholds?.[key]);
  return Number.isFinite(value) && value > 0 ? value : CFG[key];
}

function bumpCounter(key, userId, now = Date.now()) {
  const mapKey = `${key}:${userId}`;
  const arr = (state.actions.get(mapKey) || []).filter(ts => now - ts < CFG.nukeWindowMs);
  arr.push(now);
  state.actions.set(mapKey, arr);
  return arr.length;
}

async function log(guild, title, description) {
  try {
    const chId = await guild.client.store.getConfigValue(guild.id, 'CHANNEL_GENERAL_LOG').catch(() => null)
      || await guild.client.store.getConfigValue(guild.id, 'CHANNEL_MOD_LOG').catch(() => null);
    if (!chId) return;
    const ch = await guild.channels.fetch(chId).catch(() => null);
    if (!ch?.isTextBased?.()) return;
    const eb = new EmbedBuilder().setColor(0xed4245).setTitle(title).setDescription(description).setTimestamp();
    await ch.send({ embeds: [eb] }).catch(() => {});
  } catch {}
}

async function punishMember(guild, userId, reason) {
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;
    if (guild.ownerId === userId) return;
    const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
    if (!me) return;
    const removableRoles = member.roles.cache.filter(r => r.id !== guild.roles.everyone.id && r.position < me.roles.highest.position);
    if (removableRoles.size) await member.roles.remove(removableRoles, reason).catch(() => {});
    await log(guild, 'Anti-Nuke Triggered', `Stripped roles from <@${userId}>.
Reason: **${reason}**`);
  } catch {}
}

async function enableRaidMode(guild, reason) {
  if (state.raidMode.get(guild.id)) return;
  state.raidMode.set(guild.id, true);
  try {
    for (const ch of guild.channels.cache.values()) {
      if (!ch?.isTextBased?.()) continue;
      await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }, { reason: `Raid mode: ${reason}` }).catch(() => {});
    }
  } catch {}
  await log(guild, 'Raid Mode Enabled', `Server chat was temporarily locked.
Reason: **${reason}**`);
}

async function inspectAudit(guild, type, limit, entryType, userIdPath = 'executorId') {
  try {
    const cfg = await getAntiRaidConfig(guild.client.store, guild.id);
    if (cfg.mode === 'off') return;
    const logs = await guild.fetchAuditLogs({ type: entryType, limit: 1 }).catch(() => null);
    const entry = logs?.entries?.first?.();
    const executorId = entry?.executorId || entry?.executor?.id;
    if (!executorId) return;
    if (executorId === '1467522345861251258' || executorId === guild.client.user?.id) return;
    const member = await guild.members.fetch(executorId).catch(() => null);
    if (isAntiNukeExemptMember(member, C)) return;
    if (isWhitelistedMember(member, cfg)) return;
    const count = bumpCounter(type, executorId);
    if (count >= limit) {
      if (cfg.mode === 'watch') await log(guild, 'Anti-Raid Watch Triggered', `<@${executorId}> exceeded **${type}** threshold (${count}/${limit}). No punishment because mode is watch.`);
      else await punishMember(guild, executorId, `${type} threshold exceeded`);
    }
  } catch {}
}

function register(client, store) {
  client.store = store;

  client.on(Events.GuildMemberAdd, async (member) => {
    const cfg = await getAntiRaidConfig(store, member.guild.id);
    if (cfg.mode === 'off' || isWhitelistedMember(member, cfg)) return;
    const now = Date.now();
    const joinWindowMs = threshold(cfg, 'joinWindowMs');
    const alertJoins = threshold(cfg, 'alertJoins');
    const lockJoins = threshold(cfg, 'lockJoins');
    const arr = (state.joins.get(member.guild.id) || []).filter(ts => now - ts < joinWindowMs);
    arr.push(now);
    state.joins.set(member.guild.id, arr);
    const acctAge = now - member.user.createdTimestamp;
    if (acctAge < threshold(cfg, 'newAccountMs') && cfg.mode !== 'watch') {
      await member.timeout?.(10 * 60 * 1000, 'New account safety hold').catch(() => {});
    }
    if (arr.length >= lockJoins) {
      if (cfg.mode === 'watch') await log(member.guild, 'Raid Watch Alert', `${arr.length} members joined within ${joinWindowMs / 1000}s.`);
      else await enableRaidMode(member.guild, `${arr.length} joins in ${joinWindowMs / 1000}s`);
    } else if (arr.length >= alertJoins) await log(member.guild, 'Raid Alert', `${arr.length} members joined within ${joinWindowMs / 1000}s.`);
  });

  client.on(Events.ChannelDelete, async (channel) => {
    if (!channel?.guild) return;
    const cfg = await getAntiRaidConfig(store, channel.guild.id);
    await inspectAudit(channel.guild, 'channel_delete', threshold(cfg, 'channelDeleteLimit'), AuditLogEvent.ChannelDelete);
  });

  client.on(Events.RoleDelete, async (role) => {
    if (!role?.guild) return;
    const cfg = await getAntiRaidConfig(store, role.guild.id);
    await inspectAudit(role.guild, 'role_delete', threshold(cfg, 'roleDeleteLimit'), AuditLogEvent.RoleDelete);
  });

  client.on(Events.RoleUpdate, async (oldRole, newRole) => {
    if (!newRole?.guild) return;
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      const cfg = await getAntiRaidConfig(store, newRole.guild.id);
      await inspectAudit(newRole.guild, 'role_perm_edit', threshold(cfg, 'rolePermEditLimit'), AuditLogEvent.RoleUpdate);
    }
  });

  client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    if (!newChannel?.guild) return;
    const oldPerms = JSON.stringify(oldChannel.permissionOverwrites.cache.map(o => [o.id, o.allow.bitfield.toString(), o.deny.bitfield.toString()]));
    const newPerms = JSON.stringify(newChannel.permissionOverwrites.cache.map(o => [o.id, o.allow.bitfield.toString(), o.deny.bitfield.toString()]));
    if (oldPerms !== newPerms) {
      const cfg = await getAntiRaidConfig(store, newChannel.guild.id);
      await inspectAudit(newChannel.guild, 'channel_perm_edit', threshold(cfg, 'channelPermEditLimit'), AuditLogEvent.ChannelOverwriteUpdate);
    }
  });

  client.on(Events.WebhooksUpdate, async (channel) => {
    if (!channel?.guild) return;
    const cfg = await getAntiRaidConfig(store, channel.guild.id);
    await inspectAudit(channel.guild, 'webhook_update', threshold(cfg, 'webhookUpdateLimit') || 1, AuditLogEvent.WebhookCreate);
  });
}

module.exports = { register };
