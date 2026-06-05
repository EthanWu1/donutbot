const DEFAULT_ROLE_IDS = {
  rareRank: '1483225250769535210',
  epicRank: '1483225250769535211',
  headBuilder: '1483584432735785101'
};

const DEFAULT_AI_MODEL = 'claude-haiku-4-5-20251001';

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function calculateBuilderPoints(input = {}) {
  const amount = Math.max(0, Number(input.amount) || 0);
  const rating = Math.floor(clampNumber(input.rating || 0, 0, 5));
  const ratingBonus = rating >= 2 ? (rating - 1) * 5 : 0;
  const completed = Math.max(0, Math.trunc(Number(input.completedBuilds) || 0));
  const parts = {
    completed: completed * 20,
    value: Math.min(60, Math.floor(amount / 1_000_000)),
    onTime: input.onTime ? 10 : 0,
    rating: ratingBonus,
    refundPenalty: input.avoidableRefund ? -25 : 0,
    manual: Math.trunc(Number(input.manual) || 0)
  };
  return { total: Object.values(parts).reduce((sum, v) => sum + v, 0), parts };
}

function calculateStaffPoints(input = {}) {
  const parts = {
    resolvedTickets: Math.max(0, Math.trunc(Number(input.resolvedTickets) || 0)) * 5,
    applicationReviews: Math.max(0, Math.trunc(Number(input.applicationReviews) || 0)) * 6,
    modActions: Math.min(30, Math.max(0, Math.trunc(Number(input.validModActions) || 0)) * 3),
    vouches: Math.max(0, Math.trunc(Number(input.vouches) || 0)) * 4,
    messages: Math.min(25, Math.floor(Math.max(0, Math.trunc(Number(input.ticketMessages) || 0)) / 20) * 2),
    overturned: Math.max(0, Math.trunc(Number(input.overturnedActions) || 0)) * -10,
    strikes: Math.max(0, Math.trunc(Number(input.strikes) || 0)) * -30,
    manual: Math.trunc(Number(input.manual) || 0)
  };
  return { total: Object.values(parts).reduce((sum, v) => sum + v, 0), parts };
}

function roleIdsFromMember(member) {
  if (!member?.roles?.cache) return [];
  return [...member.roles.cache.values()].map(role => role.id).filter(Boolean);
}

function roleNamesFromMember(member) {
  if (!member?.roles?.cache) return [];
  return [...member.roles.cache.values()].map(role => String(role.name || '').toLowerCase()).filter(Boolean);
}

function hasRoleIdOrName(member, roleId, fallbackNames = []) {
  const roleIds = roleIdsFromMember(member);
  if (roleId && roleIds.includes(roleId)) return true;
  const names = roleNamesFromMember(member);
  return fallbackNames.some(name => names.includes(String(name).toLowerCase()));
}

function hasAnyRoleIdOrName(member, roleIds = [], fallbackNames = []) {
  return (roleIds || []).some(roleId => hasRoleIdOrName(member, roleId)) ||
    fallbackNames.some(name => roleNamesFromMember(member).includes(String(name).toLowerCase()));
}

function canApplyForRole(member, type, settings = {}) {
  const kind = String(type || '').toLowerCase();
  const rankRoles = settings.levelRoles || {};
  const roles = {
    rareRank: settings.rareRankRoleId || rankRoles[10]?.id || DEFAULT_ROLE_IDS.rareRank,
    epicRank: settings.epicRankRoleId || rankRoles[20]?.id || DEFAULT_ROLE_IDS.epicRank,
    builder: settings.builderRoleId,
    staff: settings.staffRoleId
  };
  const rarePlus = [
    roles.rareRank,
    roles.epicRank,
    rankRoles[35]?.id,
    rankRoles[50]?.id,
    rankRoles[75]?.id,
    rankRoles[100]?.id,
    rankRoles[150]?.id,
    rankRoles[200]?.id,
    rankRoles[300]?.id
  ].filter(Boolean);
  const epicPlus = rarePlus.filter(id => id !== roles.rareRank);

  if (kind === 'builder') {
    if (hasRoleIdOrName(member, roles.builder, ['builder'])) return { allowed: false, reason: 'You are already a builder.' };
    if (!hasAnyRoleIdOrName(member, rarePlus, ['rare', 'epic', 'legendary', 'mythic', 'ancient', 'divine', 'ascended', 'celestial', 'eternal'])) {
      return { allowed: false, reason: 'Builder applications require Rare rank or higher.' };
    }
    return { allowed: true };
  }

  if (kind === 'staff' || kind === 'support') {
    if (hasRoleIdOrName(member, roles.staff, ['staff', 'trial mod', 'moderator', 'manager'])) return { allowed: false, reason: 'You are already staff.' };
    if (!hasAnyRoleIdOrName(member, epicPlus, ['epic', 'legendary', 'mythic', 'ancient', 'divine', 'ascended', 'celestial', 'eternal'])) {
      return { allowed: false, reason: 'Staff applications require Epic rank or higher.' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'Unknown application type.' };
}

function isWhitelisted(subject = {}, whitelist = {}) {
  const users = new Set(whitelist.users || []);
  const roles = new Set(whitelist.roles || []);
  const channels = new Set(whitelist.channels || []);
  if (subject.userId && users.has(subject.userId)) return true;
  if (subject.channelId && channels.has(subject.channelId)) return true;
  return (subject.roleIds || []).some(roleId => roles.has(roleId));
}

function findBlacklistedPhrase(content, phrases = []) {
  const text = String(content || '').toLowerCase();
  return (phrases || [])
    .map(phrase => String(phrase || '').trim().toLowerCase())
    .filter(Boolean)
    .find(phrase => text.includes(phrase)) || null;
}

function normalizeGiveawayClaim(giveaway = {}, now = Date.now()) {
  const endedAt = Number(giveaway.endedAt || giveaway.ended_at || giveaway.endTime || 0);
  const claimTimeMs = Number(giveaway.claimTimeMs || giveaway.claim_time_ms || 0);
  const expiresAt = Number(giveaway.claimExpiresAt || 0) || (endedAt && claimTimeMs ? endedAt + claimTimeMs : null);
  return {
    ...giveaway,
    claimExpiresAt: expiresAt,
    claimOpen: !expiresAt || now <= expiresAt
  };
}

function applyRefundToBuild(build, { amount, reason, refundedBy, now = Date.now(), builderLedgerImpact = 0 } = {}) {
  const refundAmount = Math.max(0, Math.trunc(Number(amount) || 0));
  return {
    ...build,
    status: 'REFUNDED',
    refund: {
      amount: refundAmount,
      reason: reason || 'No reason provided',
      refundedBy,
      refundedAt: now,
      builderLedgerImpact: Math.max(0, Math.trunc(Number(builderLedgerImpact) || 0))
    }
  };
}

function markBuildRemoved(build, { removedBy, reason, now = Date.now() } = {}) {
  return {
    ...build,
    status: 'REMOVED',
    removedBy,
    removedReason: reason || 'Removed from queue',
    removedAt: now
  };
}

function computeNamePrefix({ level = 0, isStaff = false, isBuilder = false } = {}) {
  const rank = Number(level) >= 20 ? 'Epic' : Number(level) >= 10 ? 'Rare' : 'Common';
  const kind = isStaff ? '[S]' : (isBuilder ? '[B]' : '');
  return `${kind}[${rank}]`;
}

function getBuilderIncentives({ monthly = 0, lifetime = 0 } = {}) {
  const incentives = [];
  if (monthly >= 100) incentives.push('Monthly leaderboard eligible');
  if (monthly >= 175) incentives.push('Priority build queue');
  if (lifetime >= 500) incentives.push('Trusted builder highlight');
  return incentives;
}

function getStaffIncentives({ monthly = 0, lifetime = 0 } = {}) {
  const incentives = [];
  if (monthly >= 75) incentives.push('Monthly staff spotlight');
  if (monthly >= 125) incentives.push('Application review priority');
  if (lifetime >= 250) incentives.push('Senior staff consideration');
  return incentives;
}

function shouldAiRespond({ enabled, mentioned, isBot, now = Date.now(), lastUserResponseAt = 0, cooldownMs = 60_000 } = {}) {
  if (!enabled) return { allowed: false, reason: 'disabled' };
  if (isBot) return { allowed: false, reason: 'bot' };
  if (!mentioned) return { allowed: false, reason: 'not_mentioned' };
  if (now - lastUserResponseAt < cooldownMs) return { allowed: false, reason: 'cooldown' };
  return { allowed: true };
}

function resolveAiModel(env = process.env) {
  const configured = String(env.AI_MODEL || env.ANTHROPIC_MODEL || env.CLAUDE_MODEL || '').trim();
  return configured || DEFAULT_AI_MODEL;
}

function shouldSyncTicketPermissions({ parentId, buildCategoryIds = [], giveawayCategoryIds = [] } = {}) {
  const parent = String(parentId || '');
  if (buildCategoryIds.map(String).includes(parent)) return { shouldSync: true, type: 'build' };
  if (giveawayCategoryIds.map(String).includes(parent)) return { shouldSync: true, type: 'giveaway' };
  return { shouldSync: false, type: null };
}

module.exports = {
  DEFAULT_ROLE_IDS,
  DEFAULT_AI_MODEL,
  calculateBuilderPoints,
  calculateStaffPoints,
  roleIdsFromMember,
  hasRoleIdOrName,
  canApplyForRole,
  isWhitelisted,
  findBlacklistedPhrase,
  normalizeGiveawayClaim,
  applyRefundToBuild,
  markBuildRemoved,
  computeNamePrefix,
  getBuilderIncentives,
  getStaffIncentives,
  shouldAiRespond,
  resolveAiModel,
  shouldSyncTicketPermissions
};
