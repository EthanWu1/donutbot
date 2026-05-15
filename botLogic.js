'use strict';

const APPLICATION_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
const RETIRED_STAFF_APP_QUESTION_KEYS = new Set(['roles']);
const STAFF_VOUCHES_LABEL = 'How many vouches do you have with proof?';

function uniq(values) {
  return [...new Set((values || []).filter(v => v && String(v).trim()).map(v => String(v).trim()))];
}

function isSpawnerButton(buttonKey) {
  return ['spawner_buy', 'spawner_sell'].includes(String(buttonKey || '').toLowerCase());
}

function getTicketViewerRoleIds({ buttonKey, isBuilding, staffRoleIds, builderRoleIds, spawnerRoleId, config }) {
  if (isBuilding) return uniq(builderRoleIds);

  if (isSpawnerButton(buttonKey)) {
    // Full staff chain (incl. Support/Trial Mod) plus the dedicated
    // spawner-ticket access role. Support and Mod intentionally retain access.
    return uniq([
      ...(staffRoleIds || []),
      config?.ROLE_STAFF,
      config?.ROLE_ADMIN,
      config?.ROLE_MANAGER,
      config?.ROLE_CHIEF_MOD,
      config?.ROLE_MOD,
      config?.ROLE_TRIAL_MOD,
      spawnerRoleId,
    ]);
  }

  return uniq(staffRoleIds);
}

function sanitizeStaffApplicationQuestions(questions) {
  return (Array.isArray(questions) ? questions : [])
    .filter(q => {
      const key = String(q?.key || q?.id || '').toLowerCase();
      return !RETIRED_STAFF_APP_QUESTION_KEYS.has(key);
    })
    .map(q => {
      const key = String(q?.key || q?.id || '').toLowerCase();
      const label = key === 'vouches' ? STAFF_VOUCHES_LABEL : q.label;
      return { ...q, label, min: 0 };
    });
}

function findApplicationCooldown({ submissions, userId, typeId, now = Date.now(), cooldownMs = APPLICATION_COOLDOWN_MS }) {
  const rows = Object.values(submissions || {})
    .filter(s => String(s?.userId || '') === String(userId) && String(s?.typeId || '') === String(typeId))
    .filter(s => Number(s?.createdAt || 0) > 0)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  const last = rows[0] || null;
  if (!last) return { blocked: false, until: 0, remainingMs: 0, last: null };

  const until = Number(last.createdAt || 0) + cooldownMs;
  const remainingMs = Math.max(0, until - now);
  return { blocked: remainingMs > 0, until, remainingMs, last };
}

function plainFieldValue(value) {
  return String(value ?? '').replace(/```/g, "'''").trim().slice(0, 1024) || '-';
}

function formatApplicationReason(value) {
  const clean = String(value ?? '').replace(/`/g, "'").trim().slice(0, 1000) || 'No reason provided.';
  return `\`${clean}\``;
}

function buildApplicationReviewEmbedData({ typeTitle, typeId, userMention, userId, answers }) {
  const title = `${typeTitle || typeId || 'Application'} Pending`;
  const fields = [
    { name: 'Applicant', value: userMention || 'Unknown', inline: false },
  ];

  for (const [question, answer] of Object.entries(answers || {})) {
    fields.push({
      name: String(question || 'Question').slice(0, 250),
      value: plainFieldValue(answer),
      inline: false,
    });
  }

  return {
    color: 0xffc300,
    title,
    description: 'Submitted for review.',
    fields: fields.slice(0, 25),
  };
}

function filterCachedRoleIds(roleIds, roles) {
  const cache = roles?.cache || roles;
  if (!cache) return [];
  return uniq(roleIds).filter(id => {
    if (typeof cache.has === 'function') return cache.has(id);
    if (typeof roles?.resolve === 'function') return !!roles.resolve(id);
    return false;
  });
}

function buildBuilderLeaderboardLine(row, rank, moneyFormatter = value => String(value)) {
  const cleanName = String(row?.displayName || row?.username || 'unknown').replace(/^@+/, '').trim() || 'unknown';
  return `**${rank}.** @${cleanName}\n> **Finished:** \`${Number(row?.finished || 0)}\` | **Earned:** \`${moneyFormatter(row?.earned || 0)}\``;
}

function formatBuildHistoryLine(record, rank, moneyFormatter = value => String(value), fallbackBuilderId = null) {
  const dateStr = record?.at ? `<t:${Math.floor(Number(record.at) / 1000)}:d>` : '—';
  const builderId = record?.builderDiscordId || fallbackBuilderId;
  const builder = builderId ? `<@${builderId}>` : '—';
  const customerIgn = String(record?.customerIgn || '').trim();
  const customer = record?.customerDiscordId
    ? `<@${record.customerDiscordId}>${customerIgn ? ` (\`${customerIgn}\`)` : ''}`
    : (customerIgn ? `\`${customerIgn}\`` : '—');
  return `**${rank}.** ${dateStr} - Builder: ${builder} - Customer: ${customer} - Price: **${moneyFormatter(record?.price ?? record?.amount)}**`;
}

function getAcceptedStaffListPruneResult(list, activeUserIds) {
  const activeIds = new Set([...activeUserIds || []].map(String));
  const active = {};
  const removed = [];
  for (const [userId, entry] of Object.entries(list || {})) {
    if (activeIds.has(String(userId))) active[userId] = entry;
    else removed.push(String(userId));
  }
  return { active, removed };
}

function getAcceptedInfoKindForRoleIds(memberRoleIds, { supportRoleIds, builderRoleIds } = {}) {
  const roles = new Set((memberRoleIds || []).map(String));
  const support = (supportRoleIds || []).some(roleId => roleId && roles.has(String(roleId)));
  if (support) return 'support';
  const builder = (builderRoleIds || []).some(roleId => roleId && roles.has(String(roleId)));
  return builder ? 'builder' : null;
}

function getApplicationRoleKind(typeId) {
  const id = String(typeId || '').toLowerCase();
  if (id === 'builder' || id.includes('builder')) return 'builder';
  if (id === 'staff' || id.includes('support')) return 'support';
  return null;
}

function getApplicationAcceptanceRoleIds(kind, config) {
  if (kind === 'builder') {
    return uniq([config?.ROLE_BUILDER_TIER_1 || config?.ROLE_TIER_1_BUILDER || config?.ROLE_BUILDER_3]);
  }
  if (kind === 'support') {
    return uniq([config?.ROLE_STAFF, config?.ROLE_SUPPORT, config?.ROLE_TRIAL_MOD]);
  }
  return [];
}

function getBuilderPayoutRateForRoleIds(roleIds, config) {
  const roles = new Set((roleIds || []).map(String));
  const tier3 = config?.ROLE_BUILDER_TIER_3 || config?.ROLE_TIER_3_BUILDER || config?.ROLE_BUILDER_1;
  const tier2 = config?.ROLE_BUILDER_TIER_2 || config?.ROLE_TIER_2_BUILDER || config?.ROLE_BUILDER_2;
  if (tier3 && roles.has(String(tier3))) return 0.95;
  if (tier2 && roles.has(String(tier2))) return 0.925;
  return 0.90;
}

function formatPayoutRate(rate) {
  const pct = Math.round(Number(rate || 0) * 1000) / 10;
  return `${Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

function getEmbedEditModalValues(snapshot) {
  const snap = snapshot || {};
  const nested = snap.embed || {};
  return {
    content: String(snap.content || '').slice(0, 4000),
    title: String(nested.title ?? snap.title ?? '').slice(0, 256),
    description: String(nested.description ?? snap.description ?? '').slice(0, 4000),
    color: String(nested.color ?? snap.color ?? '#2b2d31').slice(0, 20) || '#2b2d31',
  };
}

function memberHasRole(member, roleId) {
  const id = String(roleId || '');
  if (!member || !id) return false;
  if (member.roles?.cache?.has?.(id)) return true;
  if (member.roles?.cache instanceof Map) return member.roles.cache.has(id);
  if (member.roles?.cache?.some?.(r => String(r?.id || r) === id)) return true;
  return false;
}

function isAntiNukeExemptMember(member, config) {
  if (!member) return false;
  if (member.permissions?.has?.('Administrator')) return true;
  if (member.permissions?.has?.(8n)) return true;
  return [config?.ROLE_ADMIN, config?.ROLE_MANAGER].some(roleId => memberHasRole(member, roleId));
}

function splitIgnList(text, expectedCount = 0) {
  const list = String(text || '')
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, Math.max(0, Number(expectedCount) || 0) || 5);
  return list;
}

function normalizeStaffListAltsInput(text, sanitizer = value => String(value || '').trim()) {
  if (text == null) return null;
  const raw = String(text || '').trim();
  if (!raw || /^(0|none|no|n\/a|na)$/i.test(raw)) return [];
  return splitIgnList(raw, 5).map(sanitizer).filter(Boolean).slice(0, 5);
}

module.exports = {
  APPLICATION_COOLDOWN_MS,
  buildBuilderLeaderboardLine,
  buildApplicationReviewEmbedData,
  filterCachedRoleIds,
  findApplicationCooldown,
  formatBuildHistoryLine,
  formatApplicationReason,
  getAcceptedInfoKindForRoleIds,
  getAcceptedStaffListPruneResult,
  formatPayoutRate,
  getApplicationAcceptanceRoleIds,
  getApplicationRoleKind,
  getBuilderPayoutRateForRoleIds,
  getEmbedEditModalValues,
  getTicketViewerRoleIds,
  isAntiNukeExemptMember,
  isSpawnerButton,
  normalizeStaffListAltsInput,
  sanitizeStaffApplicationQuestions,
  splitIgnList,
};
