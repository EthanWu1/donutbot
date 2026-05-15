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
    const logs = await guild.fetchAuditLogs({ type: entryType, limit: 1 }).catch(() => null);
    const entry = logs?.entries?.first?.();
    const executorId = entry?.executorId || entry?.executor?.id;
    if (!executorId) return;
    if (executorId === '1467522345861251258' || executorId === guild.client.user?.id) return;
    const member = await guild.members.fetch(executorId).catch(() => null);
    if (isAntiNukeExemptMember(member, C)) return;
    const count = bumpCounter(type, executorId);
    if (count >= limit) await punishMember(guild, executorId, `${type} threshold exceeded`);
  } catch {}
}

function register(client, store) {
  client.store = store;

  client.on(Events.GuildMemberAdd, async (member) => {
    const now = Date.now();
    const arr = (state.joins.get(member.guild.id) || []).filter(ts => now - ts < CFG.joinWindowMs);
    arr.push(now);
    state.joins.set(member.guild.id, arr);
    const acctAge = now - member.user.createdTimestamp;
    if (acctAge < CFG.newAccountMs) {
      await member.timeout?.(10 * 60 * 1000, 'New account safety hold').catch(() => {});
    }
    if (arr.length >= CFG.lockJoins) await enableRaidMode(member.guild, `${arr.length} joins in ${CFG.joinWindowMs / 1000}s`);
    else if (arr.length >= CFG.alertJoins) await log(member.guild, 'Raid Alert', `${arr.length} members joined within ${CFG.joinWindowMs / 1000}s.`);
  });

  client.on(Events.ChannelDelete, async (channel) => {
    if (!channel?.guild) return;
    await inspectAudit(channel.guild, 'channel_delete', CFG.channelDeleteLimit, AuditLogEvent.ChannelDelete);
  });

  client.on(Events.RoleDelete, async (role) => {
    if (!role?.guild) return;
    await inspectAudit(role.guild, 'role_delete', CFG.roleDeleteLimit, AuditLogEvent.RoleDelete);
  });

  client.on(Events.RoleUpdate, async (oldRole, newRole) => {
    if (!newRole?.guild) return;
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      await inspectAudit(newRole.guild, 'role_perm_edit', CFG.rolePermEditLimit, AuditLogEvent.RoleUpdate);
    }
  });

  client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    if (!newChannel?.guild) return;
    const oldPerms = JSON.stringify(oldChannel.permissionOverwrites.cache.map(o => [o.id, o.allow.bitfield.toString(), o.deny.bitfield.toString()]));
    const newPerms = JSON.stringify(newChannel.permissionOverwrites.cache.map(o => [o.id, o.allow.bitfield.toString(), o.deny.bitfield.toString()]));
    if (oldPerms !== newPerms) {
      await inspectAudit(newChannel.guild, 'channel_perm_edit', CFG.channelPermEditLimit, AuditLogEvent.ChannelOverwriteUpdate);
    }
  });

  client.on(Events.WebhooksUpdate, async (channel) => {
    if (!channel?.guild) return;
    await inspectAudit(channel.guild, 'webhook_update', 1, AuditLogEvent.WebhookCreate);
  });
}

module.exports = { register };
