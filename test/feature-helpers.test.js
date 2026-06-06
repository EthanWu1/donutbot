const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_ROLE_IDS,
  POINT_ROLE_THRESHOLDS,
  calculateBuilderPoints,
  calculateStaffPoints,
  getPointProgress,
  isWhitelisted,
  findBlacklistedPhrase,
  censorBlacklistedWord,
  canApplyForRole,
  normalizeGiveawayClaim,
  splitNumericalGiveawayPrize,
  formatDiscordUserLabel,
  getRoleAwarePointProgress,
  markBuildRemoved,
  applyRefundToBuild,
  computeNamePrefix,
  getBuilderIncentives,
  getStaffIncentives,
  shouldSyncTicketPermissions,
  shouldAiRespond,
  resolveAiModel,
  buildAiPersonalityPrompt,
  buildAiConversationPrompt,
  sanitizeAiReply
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

test('builder points use 50m value buckets plus speed boost', () => {
  const points = calculateBuilderPoints({
    completedBuilds: 1,
    amount: 200_000_000,
    completedInMs: 24 * 60 * 60 * 1000,
    avoidableRefund: false,
    manual: 3
  });

  assert.equal(points.total, 8);
  assert.deepEqual(points.parts, {
    value: 4,
    speedBonus: 1,
    refundPenalty: 0,
    manual: 3
  });
});

test('staff points emphasize closed tickets and devalue raw messages', () => {
  const points = calculateStaffPoints({
    resolvedTickets: 2,
    renamedTickets: 3,
    applicationReviews: 1,
    validModActions: 4,
    ticketMessages: 120,
    supportTicketMessages: 30,
    standardMessages: 900,
    giveawayPrizeValue: 250_000_000,
    vouches: 3,
    overturnedActions: 0,
    strikes: 0
  });

  assert.equal(points.parts.messages, 0);
  assert.equal(points.parts.supportMessages, 1);
  assert.equal(points.parts.standardMessages, 0);
  assert.equal(points.parts.closedTickets, 8);
  assert.equal(points.parts.giveaways, 2);
  assert.equal(points.total, 22);
});

test('point progress uses builder and expanded staff rank thresholds', () => {
  assert.deepEqual(POINT_ROLE_THRESHOLDS.builder, [
    { points: 25, label: 'Tier 2 Builder' },
    { points: 75, label: 'Tier 3 Builder' }
  ]);
  assert.deepEqual(POINT_ROLE_THRESHOLDS.staff.at(0), { points: 0, label: 'Trial Helper' });
  assert.equal(POINT_ROLE_THRESHOLDS.staff.at(-1).label, 'Co-owner');

  assert.deepEqual(getPointProgress('builder', 40), {
    currentLabel: 'Tier 2 Builder',
    nextLabel: 'Tier 3 Builder',
    currentFloor: 25,
    nextPoints: 75,
    progressPoints: 15,
    neededPoints: 50,
    ratio: 0.3,
    complete: false
  });

  assert.deepEqual(getRoleAwarePointProgress('staff', 12, 'Helper'), {
    currentLabel: 'Helper',
    nextLabel: 'Sr Helper',
    currentFloor: 40,
    nextPoints: 85,
    progressPoints: 0,
    neededPoints: 45,
    ratio: 0,
    complete: false
  });
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
  assert.equal(censorBlacklistedWord('bad stuff'), 'b*******f');
  assert.doesNotMatch(censorBlacklistedWord('secret phrase'), /secret phrase/);
});

test('discord labels include names so history and leaderboards are not naked ids', () => {
  assert.equal(formatDiscordUserLabel('123456789012345678', { displayName: 'Ethan', user: { tag: 'ethan#0001' } }), '<@123456789012345678> (Ethan)');
  assert.equal(formatDiscordUserLabel('manual:abc'), 'Manual adjustment');
  assert.equal(formatDiscordUserLabel('not-a-real-id'), 'Unknown source `not-a-real-id`');
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

test('numerical giveaway prize splits evenly across winners', () => {
  assert.deepEqual(splitNumericalGiveawayPrize({ prize: '10m', winnersCount: 5 }), {
    total: 10_000_000,
    perWinner: 2_000_000,
    winnersCount: 5,
    split: true
  });

  assert.equal(splitNumericalGiveawayPrize({ prize: 'VIP rank', winnersCount: 5 }), null);
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
  assert.match(prompt, /willing to roast people/i);
  assert.match(prompt, /human/i);
  assert.match(prompt, /not customer support/i);
  assert.match(prompt, /Do not use em dashes/i);
  assert.match(prompt, /No emojis/i);
  assert.match(prompt, /Never use slurs/i);
  assert.match(prompt, /embarrass/i);
  assert.doesNotMatch(prompt, /chaos/i);
  assert.doesNotMatch(prompt, /builder queue chaos/i);
  assert.doesNotMatch(prompt, /\bdaddy\b|\bmommy\b/i);
});

test('ai reply sanitizer removes em dashes before Discord send', () => {
  const reply = sanitizeAiReply(`bro\u2014that take is cooked\u2013try again`);
  assert.equal(reply, 'bro - that take is cooked - try again');
  assert.doesNotMatch(reply, /[\u2013\u2014]/);
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
