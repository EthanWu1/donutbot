'use strict';
// ═══════════════════════════════════════════════════════════════════════════
//  buildQueue.js — Build request queue
//
//  Flow:
//    User clicks Base Building / Mining button → modal (IGN + details)
//    → post to queue channel with Claim button
//    → builder clicks Claim → ticket created instantly as 🟡builder-username
//    → /build used by builder → rename to 🟠builder-username-price
//    → /build done → rename to 🟢builder-username-price
//    Unclaim → ticket deleted, request back to queue
//    Close → ticket deleted, request marked closed
//
//  DMs: queued, claimed, unclaimed, closed (with reason)
// ═══════════════════════════════════════════════════════════════════════════

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
  ChannelType, PermissionsBitField, ModalBuilder, AttachmentBuilder,
  TextInputBuilder, TextInputStyle
} = require('discord.js');
const C = require('./config');

const STATUS = { QUEUED: 'queued', ACTIVE: 'active', CLOSED: 'closed' };

const BQ_UI = {
  color: 0x08A4A7,
  id: '<:number:1483972904210141294>',
  open: '<:open:1483972944257355806>',
  close: '<:close:1483972861776363560>',
  time: '<:time:1483972812015276063>',
  member: '<:member:1483972753991274587>',
  reason: '<:reason:1483972786606309437>',
  chat: '<:chat:1483972713377828925>',
  success: '<:success:1483973364396589177>',
  menu: '<:menu:1483973395216470146>',
};

function buildQueueCloseEmbed(req, closedById) {
  return new EmbedBuilder()
    .setColor(BQ_UI.color)
    .setTitle('Ticket Closed')
    .addFields(
      { name: `${BQ_UI.id} Ticket ID`, value: String(req.id || '—'), inline: true },
      { name: `${BQ_UI.open} Opened By`, value: req.userId ? `<@${req.userId}>` : '—', inline: true },
      { name: `${BQ_UI.close} Closed By`, value: closedById ? `<@${closedById}>` : 'Staff', inline: true },
      { name: `${BQ_UI.time} Open Time`, value: req.createdAt ? `<t:${Math.floor(Number(req.createdAt) / 1000)}:f>` : '—', inline: true },
      { name: `${BQ_UI.member} Claimed By`, value: req.claimerId ? `<@${req.claimerId}>` : 'Not claimed', inline: true },
      { name: `${BQ_UI.reason} Reason`, value: req.closeReason ? String(req.closeReason).slice(0, 1024) : 'No reason specified', inline: false },
    )
    .setTimestamp();
}


async function buildChannelTranscript(channel, limit = 300) {
  try {
    const all = [];
    let before;
    while (all.length < limit) {
      const fetched = await channel.messages.fetch({ limit: Math.min(100, limit - all.length), ...(before ? { before } : {}) }).catch(() => null);
      if (!fetched || !fetched.size) break;
      const batch = [...fetched.values()];
      all.push(...batch);
      before = batch[batch.length - 1].id;
      if (fetched.size < 100) break;
    }
    all.sort((a,b) => a.createdTimestamp - b.createdTimestamp);
    return all.map(m => {
      const ts = new Date(m.createdTimestamp).toISOString();
      const author = m.author ? `${m.author.tag} (${m.author.id})` : 'Unknown';
      const body = String(m.content || '').replace(/\r/g, '');
      const atts = m.attachments?.size ? ` [attachments: ${[...m.attachments.values()].map(a => a.url).join(', ')}]` : '';
      return `[${ts}] ${author}: ${body}${atts}`.trim();
    }).join('\n');
  } catch {
    return '';
  }
}

function buildQueueDmEmbed({ title, description, channelId = null, fields = [] }) {
  const eb = new EmbedBuilder()
    .setColor(BQ_UI.color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
  const merged = [];
  if (channelId) merged.push({ name: `${BQ_UI.chat} Channel`, value: `<#${channelId}>`, inline: true });
  for (const f of fields) if (f?.name && f?.value) merged.push(f);
  if (merged.length) eb.addFields(merged);
  return eb;
}


// ── Queue board ─────────────────────────────────────────────────────────────
const BOARD_KEY = 'BUILD_QUEUE_BOARD_MESSAGE_ID';

function shortDetails(str, max = 60) {
  const s = String(str || '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s || '—';
}

function ticketRow(reqId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`bq_close:${reqId}`).setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`bq_unclaim:${reqId}`).setLabel('Unclaim').setEmoji('🙌').setStyle(ButtonStyle.Secondary)
  );
}

function queueBoardEmbed(requests) {
  const rows = requests
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .slice(0, 25)
    .map((req, idx) => `**${idx + 1}.** <@${req.userId}> • \`${req.ign}\` • ${shortDetails(req.details, 70)}\n<t:${Math.floor((req.createdAt || Date.now()) / 1000)}:R>`);

  return new EmbedBuilder()
    .setColor(BQ_UI.color)
    .setTitle('Build Queue')
    .setDescription(rows.length ? rows.join('\n\n') : 'No unclaimed build requests right now.')
    .setFooter({ text: rows.length ? 'Oldest requests appear first.' : 'Queue is clear.' })
    .setTimestamp();
}

function queueBoardComponents(requests) {
  const sorted = requests
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .slice(0, 25);
  if (!sorted.length) return [];

  const menu = new StringSelectMenuBuilder()
    .setCustomId('bq_claim_pick')
    .setPlaceholder('Claim a queued build request')
    .addOptions(sorted.map((req, idx) => ({
      label: `${idx + 1}. ${req.buildType === 'mining' ? 'Mining' : 'Base'} • ${req.ign}`.slice(0, 100),
      description: shortDetails(req.details, 95),
      value: req.id,
    })));

  return [new ActionRowBuilder().addComponents(menu)];
}

async function getQueueBoardMessage(guild, store, queueCh) {
  const storedId = await store.getConfigValue(guild.id, BOARD_KEY).catch(() => null);
  if (storedId) {
    const existing = await queueCh.messages.fetch(String(storedId)).catch(() => null);
    if (existing) return existing;
  }
  const recent = await queueCh.messages.fetch({ limit: 20 }).catch(() => null);
  const found = recent?.find?.(m => m.author?.id === guild.client.user?.id && m.embeds?.[0]?.title === 'Build Queue') || null;
  if (found) {
    await store.setConfigValue(guild.id, BOARD_KEY, found.id).catch(() => {});
    return found;
  }
  const created = await queueCh.send({ embeds: [queueBoardEmbed([])] }).catch(() => null);
  if (created) await store.setConfigValue(guild.id, BOARD_KEY, created.id).catch(() => {});
  return created;
}

const refreshTimeouts = new Map();

async function refreshQueueBoard(guild, store) {
  if (refreshTimeouts.has(guild.id)) return;
  refreshTimeouts.set(guild.id, setTimeout(() => {
    refreshTimeouts.delete(guild.id);
    _doRefreshQueueBoard(guild, store).catch(() => {});
  }, 2500));
}

async function _doRefreshQueueBoard(guild, store) {
  const queueChId = C.CHANNEL_BUILD_QUEUE;
  if (!queueChId) return;
  const queueCh = await guild.channels.fetch(queueChId).catch(() => null);
  if (!queueCh?.isTextBased?.()) return;
  const msg = await getQueueBoardMessage(guild, store, queueCh);
  if (!msg) return;
  const all = await store.listBuildRequests(guild.id).catch(() => []);
  const queued = all.filter(r => r.status === STATUS.QUEUED);
  await msg.edit({ embeds: [queueBoardEmbed(queued)], components: queueBoardComponents(queued) }).catch(() => {});
}



async function waitMs(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchUsableTextChannel(guild, channelOrId) {
  const id = typeof channelOrId === 'string' ? channelOrId : channelOrId?.id;
  if (!id || !guild) return null;
  const fresh = await guild.channels.fetch(id).catch(() => null);
  if (!fresh?.isTextBased?.()) return null;
  return fresh;
}

async function sendWithChannelRetry(guild, channelOrId, payload, opts = {}) {
  const retries = Number.isFinite(opts.retries) ? opts.retries : 3;
  const delays = Array.isArray(opts.delays) && opts.delays.length ? opts.delays : [250, 800, 1600];
  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ch = await fetchUsableTextChannel(guild, channelOrId).catch(() => null);
    if (ch) {
      try {
        return await ch.send(payload);
      } catch (e) {
        lastErr = e;
        const code = e?.code || e?.rawError?.code;
        if (code !== 10003 || attempt >= retries) throw e;
      }
    } else {
      lastErr = new Error('Unknown Channel');
      lastErr.code = 10003;
      if (attempt >= retries) throw lastErr;
    }
    await waitMs(delays[Math.min(attempt, delays.length - 1)] || 1000);
  }
  throw lastErr || new Error('Unknown Channel');
}

async function sendClaimedTicketIntro(ticketCh, req, builderMention, reqId) {
  const guild = ticketCh?.guild;
  const freshCh = guild ? await fetchUsableTextChannel(guild, ticketCh.id).catch(() => null) : ticketCh;
  if (!freshCh?.isTextBased?.()) throw new Error('Claimed ticket channel disappeared before intro could be sent.');

  const title = req.buildType === 'mining' ? 'Mining' : 'Base Building';
  const selection = req.buildType === 'mining' ? 'Mining request' : 'Base building request';
  const detailLabel = req.buildType === 'mining' ? 'Dimensions' : 'Base';
  const answerLines = [
    `**IGN**\n${req.ign}`,
    `**${detailLabel}**\n${req.details}`,
  ];

  const main = new EmbedBuilder()
    .setColor(0x08a4a7)
    .setTitle(title)
    .setDescription('Thanks for opening a build ticket. Use this channel to discuss the request and confirm details.')
    .addFields({ name: 'Selection', value: selection });

  const answers = new EmbedBuilder()
    .setColor(0x08a4a7)
    .setDescription(answerLines.join('\n\n').slice(0, 4000));

  const payloads = [
    {
      content: `${builderMention} <@${req.userId}>`,
      embeds: [main, answers],
      components: [ticketRow(reqId)],
    },
    {
      content: `${builderMention} <@${req.userId}>`,
      embeds: [main, answers],
    },
    {
      content: `${builderMention} <@${req.userId}>\n\n${answerLines.join('\n\n')}`.slice(0, 1900),
      embeds: [main],
    },
    {
      content: `Claimed build ticket for <@${req.userId}>. ${selection}.`,
    },
  ];

  let msg = null;
  let lastErr = null;
  for (const payload of payloads) {
    try {
      msg = await sendWithChannelRetry(freshCh.guild, freshCh, payload, { retries: 4, delays: [350, 1000, 2000, 3500] });
      if (msg) break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!msg) throw lastErr || new Error('Could not initialize the claimed ticket channel.');
  try { if (!msg.pinned) await msg.pin(); } catch {}
  return msg;
}

async function dmUser(client, userId, payload) {
  try {
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return;
    const dm = await user.createDM().catch(() => null);
    if (!dm) return;
    if (typeof payload === 'string') {
      await dm.send({ embeds: [buildQueueDmEmbed({ title: 'Build Queue Update', description: payload })] }).catch(() => {});
      return;
    }
    await dm.send(payload).catch(() => {});
  } catch {}
}

// ── Modal: show build request form based on button key (base or mining) ──────
async function showBuildRequestModal(interaction, buildType) {
  const isBase = buildType === 'base';
  const modal = new ModalBuilder()
    .setCustomId(`bq_modal:${buildType}`)
    .setTitle(isBase ? 'Base Building Request' : 'Mining Request');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('ign').setLabel('IGN')
        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(32)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('details')
        .setLabel(isBase ? 'Which base do you want?' : 'What size? (e.g. 16x16x8)')
        .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(200)
    ),
  );
  await interaction.showModal(modal);
}

// ── Modal submit ─────────────────────────────────────────────────────────────
async function handleModalSubmit(interaction, buildType, store) {
  await interaction.deferReply({ flags: 64 }).catch(() => {});

  const ign     = interaction.fields.getTextInputValue('ign').trim();
  const details = interaction.fields.getTextInputValue('details').trim();

  const queueChId = C.CHANNEL_BUILD_QUEUE;
  if (!queueChId) return interaction.editReply('❌ Build queue channel is missing in config.');

  const queueCh = await interaction.guild.channels.fetch(queueChId).catch(() => null);
  if (!queueCh) return interaction.editReply('❌ Build queue channel not found.');

  const existing = (await store.listBuildRequests(interaction.guildId).catch(() => []))
    .find(r => String(r.userId) === String(interaction.user.id)
      && String(r.buildType) === String(buildType)
      && [STATUS.QUEUED, STATUS.ACTIVE].includes(String(r.status || '').toLowerCase()));
  if (existing) {
    return interaction.editReply(`❌ You already have an active ${buildType === 'mining' ? 'mining' : 'building'} request.`);
  }

  const reqId = require('node:crypto').randomBytes(5).toString('hex');
  const req = {
    id: reqId, buildType,
    userId: interaction.user.id, guildId: interaction.guildId,
    ign, details,
    status: STATUS.QUEUED,
    claimerId: null, ticketChannelId: null, queueMessageId: null,
    createdAt: Date.now(),
  };
  await store.setBuildRequest(reqId, req);
  await refreshQueueBoard(interaction.guild, store);

  await interaction.editReply("✅ Your request has been added to the build queue. You'll get a DM when a builder claims it.");

  await dmUser(interaction.client, interaction.user.id, {
    embeds: [buildQueueDmEmbed({
      title: 'Request Queued',
      description: 'Your build request is in the queue.',
      fields: [
        { name: `${BQ_UI.id} Request ID`, value: `\`${reqId}\``, inline: true },
        { name: `${BQ_UI.menu} Type`, value: buildType === 'mining' ? 'Mining' : 'Base Building', inline: true },
        { name: `${BQ_UI.member} IGN`, value: `\`${ign}\``, inline: true },
        { name: `${BQ_UI.reason} Details`, value: details.slice(0, 1024), inline: false },
      ],
    })],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bq_cancel:${reqId}`).setLabel('Cancel').setStyle(ButtonStyle.Danger)
    )]
  });
}

// ── Claim ────────────────────────────────────────────────────────────────────
async function handleClaim(interaction, reqId, store) {
  await interaction.deferUpdate().catch(() => {});
  const req = await store.getBuildRequest(reqId);
  if (!req) return interaction.followUp({ content: '❌ Request not found.', flags: 64 });
  if (req.status !== STATUS.QUEUED) return interaction.followUp({ content: '❌ Already claimed.', flags: 64 });

  const guild = interaction.guild;

  // Allow builders to hold up to 3 active builds at once; auto-clear stale ones first
  const allReqs = await store.listBuildRequests(guild.id);
  const activeOpen = [];
  for (const r of (allReqs || [])) {
    if (r?.claimerId !== interaction.user.id || r?.status !== STATUS.ACTIVE) continue;
    const channelId = r.ticketChannelId || null;
    const ticketCh = channelId ? await guild.channels.fetch(channelId).catch(() => null) : null;
    const ticketRec = channelId ? await store.getTicketRecord(channelId).catch(() => null) : null;
    const isActuallyOpen = !!ticketCh && (!ticketRec || String(ticketRec.status || 'OPEN').toUpperCase() === 'OPEN');
    if (isActuallyOpen) {
      activeOpen.push(r);
      continue;
    }
    r.status = STATUS.QUEUED;
    r.claimerId = null;
    r.ticketChannelId = null;
    await store.setBuildRequest(r.id, r).catch(() => {});
    if (channelId && ticketRec) {
      await store.updateTicketRecord(channelId, { status: 'CLOSED', claimedById: null, claimedAt: null, closeReason: 'Auto-cleared stale build claim', closedAt: Date.now() }).catch(() => {});
    }
  }
  if (activeOpen.length >= 3) {
    const refs = activeOpen.slice(0, 3).map(r => r.ticketChannelId ? `<#${r.ticketChannelId}>` : `\`${r.id}\``).join(', ');
    return interaction.followUp({ content: `❌ You already have 3 active builds: ${refs}. Close one first.`, flags: 64 });
  }

  const categoryId = C.TICKET_CATEGORIES.BUILDING;
  if (!categoryId) return interaction.followUp({ content: '❌ Building category is missing in config.', flags: 64 });

  const staffRoleIds = [C.ROLE_MANAGER, C.ROLE_ADMIN, C.ROLE_CO_OWNER, C.ROLE_OWNER].filter(Boolean);

  // Channel name: 🟡builder-username
  const builderSlug = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
  const channelName = `🟡-${builderSlug}`.slice(0, 100);

  const ALLOW = [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles];
  const STAFF_ALLOW = [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageMessages];

  const botMember = guild.members.me || await guild.members.fetchMe().catch(() => null);
  const botAllow = [
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.ReadMessageHistory,
    PermissionsBitField.Flags.AttachFiles,
    PermissionsBitField.Flags.ManageMessages,
    PermissionsBitField.Flags.ManageChannels,
    PermissionsBitField.Flags.EmbedLinks,
  ];

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    ...(botMember ? [{ id: botMember.id, allow: botAllow }] : []),
    { id: interaction.user.id, allow: ALLOW },
    { id: req.userId, allow: ALLOW },
    ...staffRoleIds.map(rid => ({ id: rid, allow: STAFF_ALLOW })),
  ];

  let ticketCh;
  try {
    ticketCh = await guild.channels.create({
      name: channelName, type: ChannelType.GuildText,
      parent: categoryId, permissionOverwrites: overwrites,
    });
    ticketCh = await fetchUsableTextChannel(guild, ticketCh).catch(() => null);
    if (!ticketCh) throw new Error('Claim ticket channel was created but Discord did not make it available in time.');
  } catch (e) {
    return interaction.followUp({ content: `❌ Failed to create channel: ${e.message}`, flags: 64 });
  }

  req.status = STATUS.ACTIVE;
  req.claimerId = interaction.user.id;
  req.ticketChannelId = ticketCh.id;
  await store.setBuildRequest(reqId, req);
  await refreshQueueBoard(guild, store);

  // Register as a ticket record so /build can rename it via syncTicketChannelName
  try {
    const seq = await store.nextTicketId().catch(() => null);
    await store.createTicketRecord(ticketCh.id, {
      channelId: ticketCh.id,
      guildId: guild.id,
      creatorId: req.userId,
      panelId: 'building_services',
      buttonId: req.buildType,
      label: req.buildType === 'mining' ? 'Mining' : 'Base Building',
      createdAt: Date.now(),
      status: 'OPEN',
      claimedById: interaction.user.id,
      claimedAt: Date.now(),
      claimerUsername: interaction.user.username,
      ticketType: 'normal',
      builderId: interaction.user.id,
      etaEnd: null,
      controlMessageId: null,
      ticketNum: seq,
      channelBaseName: interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20),
      buildFarmName: null,
      buildAmount: null,
    });
    await store.recordTicketOpened(guild.id, interaction.user.id).catch(() => {});
  } catch {}

  try {
    await sendClaimedTicketIntro(ticketCh, req, interaction.user.toString(), reqId);
  } catch (e) {
    console.error('[BuildQueue] claimed ticket init failed:', e);
    // Best-effort final fallback so a valid claimed channel is not thrown away just
    // because the rich intro message failed.
    try {
      await sendWithChannelRetry(guild, ticketCh, {
        content: `<@${req.userId}> Claimed by ${interaction.user.toString()}. Use this channel to continue the build request.`.slice(0, 1900),
      }, { retries: 5, delays: [500, 1200, 2500, 4000, 6000] });
    } catch (fallbackErr) {
      console.error('[BuildQueue] claimed ticket plain-text fallback failed:', fallbackErr);
      req.status = STATUS.QUEUED;
      req.claimerId = null;
      req.ticketChannelId = null;
      await store.setBuildRequest(reqId, req).catch(() => {});
      try { await store.updateTicketRecord(ticketCh.id, { status: 'CLOSED', claimedById: null, claimedAt: null, closeReason: 'Claim init failed', closedAt: Date.now() }).catch(() => {}); } catch {}
      try { await ticketCh.delete().catch(() => {}); } catch {}
      await refreshQueueBoard(guild, store).catch(() => {});
      return interaction.followUp({ content: `❌ Failed to initialize the claimed ticket channel. The request was returned to the queue.`, flags: 64 });
    }
  }

  await dmUser(interaction.client, req.userId, {
    embeds: [buildQueueDmEmbed({
      title: 'Request Claimed',
      description: 'A builder claimed your request.',
      channelId: ticketCh.id,
      fields: [
        { name: `${BQ_UI.id} Request ID`, value: `\`${reqId}\``, inline: true },
        { name: `${BQ_UI.member} Builder`, value: interaction.user.toString(), inline: true },
      ],
    })]
  });

  await dmUser(interaction.client, interaction.user.id, {
    embeds: [buildQueueDmEmbed({
      title: 'Request Claimed',
      description: 'You claimed a build request.',
      channelId: ticketCh.id,
      fields: [
        { name: `${BQ_UI.id} Request ID`, value: `\`${reqId}\``, inline: true },
        { name: `${BQ_UI.member} Customer`, value: `<@${req.userId}>`, inline: true },
      ],
    })]
  });
}

// ── Unclaim ──────────────────────────────────────────────────────────────────
async function handleUnclaim(interaction, reqId, store) {
  await interaction.deferReply({ flags: 64 }).catch(() => {});
  const req = await store.getBuildRequest(reqId);
  if (!req) return interaction.editReply('❌ Request not found.');
  if (req.status !== STATUS.ACTIVE) return interaction.editReply('❌ Not active.');

  const isAdmin = interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator);
  if (req.claimerId !== interaction.user.id && !isAdmin) return interaction.editReply('❌ Only the claiming builder or admin can unclaim.');

  const oldClaimerId = req.claimerId;

  req.status = STATUS.QUEUED;
  req.claimerId = null;
  req.ticketChannelId = null;
  await store.setBuildRequest(reqId, req);

  await refreshQueueBoard(interaction.guild, store);

  if (interaction.channelId) {
    await store.updateTicketRecord(interaction.channelId, { status: 'CLOSED', claimedById: null, claimedAt: null, closeReason: 'Unclaimed', closedAt: Date.now(), closedById: interaction.user.id }).catch(() => {});
  }

  // Delete ticket channel
  try {
    const ch = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
    if (ch) await ch.delete().catch(() => {});
  } catch {}

  await dmUser(interaction.client, req.userId, {
    embeds: [buildQueueDmEmbed({
      title: 'Request Returned',
      description: 'Your request was returned to the queue.',
      fields: [
        { name: `${BQ_UI.id} Request ID`, value: `\`${reqId}\``, inline: true },
      ],
    })]
  });
  if (oldClaimerId) {
    await dmUser(interaction.client, oldClaimerId, {
    embeds: [buildQueueDmEmbed({
      title: 'Request Returned',
      description: 'You returned a build request to the queue.',
      fields: [
        { name: `${BQ_UI.id} Request ID`, value: `\`${reqId}\``, inline: true },
      ],
    })]
  });
  }
}


async function handleCancel(interaction, reqId, store) {
  await interaction.deferReply({ flags: 64 }).catch(() => {});
  const req = await store.getBuildRequest(reqId).catch(() => null);
  if (!req) return interaction.editReply('❌ Request not found.');
  if (String(req.userId) !== String(interaction.user.id)) return interaction.editReply('❌ Only the requester can cancel this.');
  if (String(req.status) !== STATUS.QUEUED) return interaction.editReply('❌ This request is no longer queued.');
  req.status = STATUS.CLOSED;
  req.closedAt = Date.now();
  req.closeReason = 'Cancelled by requester';
  await store.setBuildRequest(reqId, req).catch(() => {});
  await refreshQueueBoard(interaction.guild, store).catch(() => {});
  return interaction.editReply('✅ Request cancelled.');
}

// ── Close: show reason modal ─────────────────────────────────────────────────
async function showCloseModal(interaction, reqId) {
  const modal = new ModalBuilder().setCustomId(`bq_close_reason:${reqId}`).setTitle('Close Build Ticket');
  modal.addComponents(new ActionRowBuilder().addComponents(
    new TextInputBuilder().setCustomId('reason').setLabel('Reason (shown to customer)')
      .setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500)
      .setPlaceholder('e.g. Build completed and delivered.')
  ));
  await interaction.showModal(modal);
}

async function handleClose(interaction, reqId, reason, store) {
  const req = await store.getBuildRequest(reqId);
  if (!req) return interaction.reply({ content: '❌ Request not found.', flags: 64 });
  const isAdmin = interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator);
  const isStaff = interaction.member?.permissions?.has(PermissionsBitField.Flags.ManageGuild);
  if (req.claimerId !== interaction.user.id && req.userId !== interaction.user.id && !isAdmin && !isStaff) {
    return interaction.reply({ content: '❌ Only the builder, customer, or staff can close this.', flags: 64 });
  }

  await interaction.deferReply({ flags: 64 }).catch(() => {});

  req.status = STATUS.CLOSED;
  req.closedAt = Date.now();
  req.closeReason = reason;
  req.closedById = interaction.user.id;
  await store.setBuildRequest(reqId, req);

  await refreshQueueBoard(interaction.guild, store);

  if (interaction.channelId) {
    await store.updateTicketRecord(interaction.channelId, { status: 'CLOSED', closeReason: reason, closedAt: Date.now(), closedById: interaction.user.id }).catch(() => {});
  }

  const closedEmbed = buildQueueCloseEmbed(req, interaction.user.id);

  await dmUser(interaction.client, req.userId, { embeds: [closedEmbed] });

  try {
    const logCh = await interaction.guild.channels.fetch('1483225253307220203').catch(() => null);
    if (logCh?.isTextBased?.()) {
      const transcript = await buildChannelTranscript(interaction.channel, 300);
      const files = [];
      if (transcript) files.push(new AttachmentBuilder(Buffer.from(transcript, 'utf8'), { name: `transcript-${req.id || interaction.channelId}.txt` }));
      await logCh.send({ embeds: [closedEmbed], files }).catch(() => {});
    }
  } catch {}

  await interaction.editReply('✅ Closed.').catch(() => {});

  try {
    const ch = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
    if (ch) await ch.delete().catch(() => {});
  } catch {}
}

// ── Interaction router ────────────────────────────────────────────────────────
async function handleInteraction(interaction, store) {
  const cid = interaction.customId || '';

  // Panel buttons: bq_open triggers the modal based on the button key
  // The button key is passed as bq_open:base or bq_open:mining
  if (interaction.isButton() && cid === 'bq_open') {
    // Default to base if key not specified
    await showBuildRequestModal(interaction, 'base');
    return true;
  }
  if (interaction.isButton() && cid === 'bq_open:base') {
    await showBuildRequestModal(interaction, 'base');
    return true;
  }
  if (interaction.isButton() && cid === 'bq_open:mining') {
    await showBuildRequestModal(interaction, 'mining');
    return true;
  }

  if (interaction.isModalSubmit() && cid.startsWith('bq_modal:')) {
    const buildType = cid.split(':')[1] || 'base';
    await handleModalSubmit(interaction, buildType, store);
    return true;
  }
  if (interaction.isStringSelectMenu() && cid === 'bq_claim_pick') {
    await handleClaim(interaction, interaction.values?.[0], store);
    return true;
  }
  if (interaction.isButton() && cid.startsWith('bq_unclaim:')) {
    await handleUnclaim(interaction, cid.split(':')[1], store);
    return true;
  }
  if (interaction.isButton() && cid.startsWith('bq_cancel:')) {
    await handleCancel(interaction, cid.split(':')[1], store);
    return true;
  }
  if (interaction.isButton() && cid.startsWith('bq_close:')) {
    await showCloseModal(interaction, cid.split(':')[1]);
    return true;
  }
  if (interaction.isModalSubmit() && cid.startsWith('bq_close_reason:')) {
    const reqId = cid.split(':')[1];
    const reason = interaction.fields.getTextInputValue('reason');
    await handleClose(interaction, reqId, reason, store);
    return true;
  }
  return false;
}

module.exports = { handleInteraction, showBuildRequestModal, refreshQueueBoard, STATUS };
