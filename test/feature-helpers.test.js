const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_ROLE_IDS,
  calculateBuilderPoints,
  calculateStaffPoints,
  isWhitelisted,
  findBlacklistedPhrase,
  canApplyForRole,
  normalizeGiveawayClaim,
  markBuildRemoved,
  applyRefundToBuild,
  computeNamePrefix,
  getBuilderIncentives,
  getStaffIncentives,
  shouldSyncTicketPermissions,
  shouldAiRespond,
  resolveAiModel,
  buildAiPersonalityPrompt,
  buildAiConversationPrompt
} = require('../botFeatures');

function memberWithRoles(roleIds = [], roleNames = []) {
  return {
    roles: {
      cache: new Map([
        ...roleIds.map(id => [id, { id, name: id, position: 1 }]),
        ...roleNames.map((name, i) => [`name-${i}`, { id: `name-${i}`, name, position: 1 }])
      ])
    },
    permissions: { has: () => false }
  };
}

test('builder points reward completed value but cap huge orders', () => {
  const points = calculateBuilderPoints({
    completedBuilds: 1,
    amount: 200_000_000,
    onTime: true,
    rating: 5,
    avoidableRefund: false,
    manual: 3
  });

  assert.equal(points.total, 113);
  assert.deepEqual(points.parts, {
    completed: 20,
    value: 60,
    onTime: 10,
    rating: 20,
    refundPenalty: 0,
    manual: 3
  });
});

test('staff points cap routine moderation credit per day', () => {
  const points = calculateStaffPoints({
    resolvedTickets: 2,
    applicationReviews: 1,
    validModActions: 20,
    vouches: 3,
    overturnedActions: 1,
    strikes: 1
  });

  assert.equal(points.parts.modActions, 30);
  assert.equal(points.total, 18);
});

test('whitelist matches user, channel, or any member role', () => {
  const whitelist = {
    users: ['user-1'],
    roles: ['role-2'],
    channels: ['channel-3']
  };

  assert.equal(isWhitelisted({ userId: 'user-1', channelId: 'x', roleIds: [] }, whitelist), true);
  assert.equal(isWhitelisted({ userId: 'x', channelId: 'channel-3', roleIds: [] }, whitelist), true);
  assert.equal(isWhitelisted({ userId: 'x', channelId: 'x', roleIds: ['role-2'] }, whitelist), true);
  assert.equal(isWhitelisted({ userId: 'x', channelId: 'x', roleIds: ['role-9'] }, whitelist), false);
});

test('blacklisted phrase matching is case-insensitive and ignores blank entries', () => {
  assert.equal(findBlacklistedPhrase('Selling BAD Stuff here', ['bad stuff', '']), 'bad stuff');
  assert.equal(findBlacklistedPhrase('ordinary message', ['bad stuff']), null);
});

test('application gates require rare for builder and epic for staff', () => {
  const rareMember = memberWithRoles([DEFAULT_ROLE_IDS.rareRank]);
  const epicMember = memberWithRoles([DEFAULT_ROLE_IDS.epicRank]);
  const commonMember = memberWithRoles(['other']);

  assert.equal(canApplyForRole(rareMember, 'builder').allowed, true);
  assert.equal(canApplyForRole(epicMember, 'staff').allowed, true);
  assert.equal(canApplyForRole(commonMember, 'builder').allowed, false);
  assert.equal(canApplyForRole(rareMember, 'staff').allowed, false);
});

test('giveaway claimtime disables claim after expiry', () => {
  const giveaway = normalizeGiveawayClaim({
    endedAt: 1_000,
    claimTimeMs: 5_000,
    claimedBy: []
  }, 7_000);

  assert.equal(giveaway.claimOpen, false);
});

test('build removal and refunds update tracking state', () => {
  const build = {
    id: 'b1',
    status: 'queued',
    requesterId: 'user-1',
    builderPaidAmount: 40_000_000
  };

  const removed = markBuildRemoved(build, {
    removedBy: 'staff-1',
    reason: 'requester left',
    now: 10
  });
  assert.equal(removed.status, 'REMOVED');
  assert.equal(removed.removedReason, 'requester left');

  const refunded = applyRefundToBuild(build, {
    amount: 25_000_000,
    reason: 'customer refund',
    refundedBy: 'manager-1',
    now: 20,
    builderLedgerImpact: 25_000_000
  });
  assert.equal(refunded.refund.amount, 25_000_000);
  assert.equal(refunded.refund.builderLedgerImpact, 25_000_000);
  assert.equal(refunded.status, 'REFUNDED');
});

test('name prefix picks staff/builder marker and highest rank label', () => {
  const prefix = computeNamePrefix({
    level: 22,
    isStaff: false,
    isBuilder: true
  });

  assert.equal(prefix, '[B][Epic]');
});

test('incentives are earned from monthly and lifetime point thresholds', () => {
  assert.deepEqual(getBuilderIncentives({ monthly: 180, lifetime: 550 }), [
    'Monthly leaderboard eligible',
    'Priority build queue',
    'Trusted builder highlight'
  ]);
  assert.deepEqual(getStaffIncentives({ monthly: 130, lifetime: 300 }), [
    'Monthly staff spotlight',
    'Application review priority',
    'Senior staff consideration'
  ]);
});

test('ticket permission sync targets configured build and giveaway categories', () => {
  assert.deepEqual(shouldSyncTicketPermissions({
    parentId: 'giveaways',
    buildCategoryIds: ['builds'],
    giveawayCategoryIds: ['giveaways']
  }), { shouldSync: true, type: 'giveaway' });

  assert.deepEqual(shouldSyncTicketPermissions({
    parentId: 'other',
    buildCategoryIds: ['builds'],
    giveawayCategoryIds: ['giveaways']
  }), { shouldSync: false, type: null });
});

test('ai responder only responds to mentions when enabled and not cooled down', () => {
  assert.equal(shouldAiRespond({
    enabled: true,
    mentioned: true,
    isBot: false,
    now: 10_000,
    lastUserResponseAt: 0,
    cooldownMs: 5_000
  }).allowed, true);

  assert.equal(shouldAiRespond({
    enabled: true,
    mentioned: true,
    isBot: false,
    now: 10_000,
    lastUserResponseAt: 9_000,
    cooldownMs: 5_000
  }).allowed, false);

  assert.equal(shouldAiRespond({
    enabled: true,
    mentioned: false,
    repliedToBot: true,
    isBot: false,
    now: 10_000,
    lastUserResponseAt: 0,
    cooldownMs: 5_000
  }).allowed, true);

  assert.equal(shouldAiRespond({
    enabled: true,
    mentioned: false,
    repliedToBot: true,
    isBot: false,
    now: 10_000,
    lastUserResponseAt: 9_000,
    cooldownMs: 5_000
  }).allowed, true);
});

test('ai model defaults to current cheapest Haiku when unset', () => {
  assert.equal(resolveAiModel({}), 'claude-haiku-4-5-20251001');
  assert.equal(resolveAiModel({ AI_MODEL: 'custom-model' }), 'custom-model');
  assert.equal(resolveAiModel({ CLAUDE_MODEL: 'claude-alt' }), 'claude-alt');
});

test('ai personality prompt is server-aware and owner-safe while allowing light roasts', () => {
  const prompt = buildAiPersonalityPrompt({
    serverName: 'EtZ Empire',
    memberCount: 1234,
    ownerId: '42',
    ownerName: 'Ethan',
    ownerRoleMembers: [{ id: '42', name: 'Ethan' }],
    currentUserName: 'Some Builder',
    isOwner: false,
    extraServerContext: 'Public farm stats: Mega Kelp does 1.2m kelp/hr. Published schematic: Blaze Tower profit 4.5m/hr.'
  });

  assert.match(prompt, /EtZ Empire/);
  assert.match(prompt, /1,234 members/);
  assert.match(prompt, /Ethan/);
  assert.match(prompt, /42/);
  assert.match(prompt, /Owner role holders: Ethan \(42\)/);
  assert.match(prompt, /Never roast the owner/i);
  assert.match(prompt, /glaze/i);
  assert.match(prompt, /Public farm stats/i);
  assert.match(prompt, /Published schematic/i);
  assert.match(prompt, /build tickets/i);
  assert.match(prompt, /giveaways/i);
  assert.match(prompt, /applications/i);
  assert.match(prompt, /light roasts/i);
  assert.match(prompt, /No emojis/i);
  assert.match(prompt, /Never use slurs/i);
  assert.match(prompt, /embarrass/i);
  assert.doesNotMatch(prompt, /chaos/i);
  assert.doesNotMatch(prompt, /builder queue chaos/i);
  assert.match(prompt, /daddy|mommy/i);
});

test('ai conversation prompt includes reply chain and only the last three bot replies', () => {
  const prompt = buildAiConversationPrompt({
    currentUserName: 'Builder One',
    currentPrompt: 'what did you mean?',
    replyChain: [
      { authorName: 'Builder One', isBot: false, content: 'rate my dirt hut' },
      { authorName: 'DonutBot', isBot: true, content: 'That dirt hut has starter base energy.' },
      { authorName: 'Builder One', isBot: false, content: 'keep going' }
    ],
    recentBotReplies: [
      { content: 'old reply one' },
      { content: 'recent reply two' },
      { content: 'recent reply three' },
      { content: 'recent reply four' }
    ]
  });

  assert.match(prompt, /Conversation being replied to/);
  assert.match(prompt, /Builder One: rate my dirt hut/);
  assert.match(prompt, /DonutBot: That dirt hut has starter base energy/);
  assert.match(prompt, /Current message from Builder One: what did you mean/);
  assert.doesNotMatch(prompt, /old reply one/);
  assert.match(prompt, /recent reply two/);
  assert.match(prompt, /recent reply three/);
  assert.match(prompt, /recent reply four/);
  assert.ok(prompt.indexOf('Builder One: rate my dirt hut') < prompt.indexOf('DonutBot: That dirt hut'));
});
