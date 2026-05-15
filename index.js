require('dotenv').config();
const C = require('./config');

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const https = require('node:https');

const { 
  Client, 
  Events,
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionsBitField,
  ChannelType,
  Colors,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  UserSelectMenuBuilder,
  resolveColor,
  AttachmentBuilder 
} = require('discord.js');

const { renderLevelCard } = require('./levelCard');
const automod = require('./automod');
const antiraid = require('./antiraid');
const buildQueue = require('./buildQueue');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const store = require('./store');
const { getUserBalance } = require('./donutsApi');
const { parseNumber, parseDuration, getLevelFromXp, getXpForLevel, sanitizeDisplayName } = require('./utils');
const { generateRankCard } = require('./rankCard');
const { handleRenderCommand } = require('./lib/litematicRenderCommand');
const {
  APPLICATION_COOLDOWN_MS,
  buildBuilderLeaderboardLine,
  buildApplicationReviewEmbedData,
  filterCachedRoleIds,
  findApplicationCooldown,
  formatBuildHistoryLine,
  formatApplicationReason,
  formatPayoutRate,
  getAcceptedInfoKindForRoleIds,
  getAcceptedStaffListPruneResult,
  getApplicationAcceptanceRoleIds,
  getApplicationRoleKind,
  getBuilderPayoutRateForRoleIds,
  getEmbedEditModalValues,
  getTicketViewerRoleIds,
  isSpawnerButton,
  normalizeStaffListAltsInput,
  sanitizeStaffApplicationQuestions,
  splitIgnList,
} = require('./botLogic');

// Lazy-loaded inside the litematic handlers so missing render deps
// (puppeteer, etc.) do not crash bot boot for unrelated features.
let _litematicRender = null;
function getLitematicRender() {
  if (!_litematicRender) _litematicRender = require('./lib/litematicRender/renderer');
  return _litematicRender;
}


// ═══════════════════════════════════════════════════════════════════════════
// FEATURE BLOCK: AUTONICK / LOA / CATALOG
// ═══════════════════════════════════════════════════════════════════════════
const LOA_ROLE_ID = C.ROLE_LOA;
const CATALOG_STAFF_ROLE_IDS = new Set(C.ROLES_CATALOG_STAFF.filter(Boolean));
function isCatalogStaff(member) {
  if (!member) return false;
  if (member.permissions?.has?.(PermissionsBitField.Flags.Administrator)) return true;
  return member.roles.cache.some(r => CATALOG_STAFF_ROLE_IDS.has(r.id));
}

const GIVEAWAY_CREATOR_ROLE_IDS = new Set([
  C.ROLE_STAFF,
  C.ROLE_BUILDER_1,
  C.ROLE_BUILDER_2,
  C.ROLE_BUILDER_3,
  ...(Array.isArray(C.ROLES_GIVEAWAY_MANAGER) ? C.ROLES_GIVEAWAY_MANAGER : []),
].filter(Boolean));

function canManageGiveaways(member) {
  if (!member) return false;
  if (member.permissions?.has?.(PermissionsBitField.Flags.Administrator)) return true;
  return member.roles?.cache?.some?.(r => GIVEAWAY_CREATOR_ROLE_IDS.has(r.id)) || false;
}

// Static autonick entries — seeded into store on startup so /autonick list shows them
const STATIC_AUTONICK_ENTRIES = C.AUTONICK_ENTRIES;

function parseKelpNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return null;
  const s = String(str).trim().toLowerCase().replace(/,/g, '');
  const m = s.match(/^(\d+(?:\.\d+)?)([kmb])?$/);
  if (!m) return parseFloat(s) || null;
  let n = parseFloat(m[1]);
  if (m[2] === 'k') n *= 1_000;
  else if (m[2] === 'm') n *= 1_000_000;
  else if (m[2] === 'b') n *= 1_000_000_000;
  return Math.floor(n);
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const w = Math.floor(totalSec / 604800);
  const d = Math.floor((totalSec % 604800) / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts = [];
  if (w) parts.push(`${w}w`);
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s && !w && !d) parts.push(`${s}s`);
  return parts.join(' ') || '0s';
}

function fmtNum(n) {
  if (n == null || isNaN(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${parseFloat((n / 1_000_000_000).toFixed(2))}b`;
  if (abs >= 1_000_000)     return `${parseFloat((n / 1_000_000).toFixed(2))}m`;
  if (abs >= 1_000)         return `${parseFloat((n / 1_000).toFixed(1))}k`;
  return String(Math.round(n));
}

// Returns "per hour" or "per X hours" depending on multiplier
function perLabel(multiplier) {
  if (!multiplier || multiplier === 1) return 'per hour';
  return `every ${multiplier % 1 === 0 ? multiplier : multiplier} hours`;
}

function calcKelpFarmStats(farm, prices, multiplier = 1) {
  const kph = (farm.kelp_per_hour || 0) * multiplier;
  const dkbPerHour = kph / 9;
  const revenue = dkbPerHour * (prices.dried_kelp_block || 0);
  const bonesPerHour = (farm.bone_input === 'bones' || farm.bone_input === 'both') ? kph / 3 : 0;
  const boneBlocksPerHour = (farm.bone_input === 'bone_blocks' || farm.bone_input === 'both') ? kph / 9 : 0;
  const blazesPerHour = kph / 12;
  const boneCost = bonesPerHour * (prices.bone || 0);
  const boneBlockCost = boneBlocksPerHour * (prices.bone_block || 0);
  const blazeCost = blazesPerHour * (prices.blaze_rod || 0);
  const totalCostBones = boneCost + blazeCost;
  const totalCostBoneBlocks = boneBlockCost + blazeCost;
  const totalCost = boneCost + boneBlockCost + blazeCost;
  const profitBones = revenue - totalCostBones;
  const profitBoneBlocks = revenue - totalCostBoneBlocks;
  const profit = revenue - totalCost;
  // Storage always uses unscaled kph so duration reflects real-world fill time
  const baseKph = farm.kelp_per_hour || 0;
  const baseBones = (farm.bone_input === 'bones' || farm.bone_input === 'both') ? baseKph / 3 : 0;
  const baseBoneBlocks = (farm.bone_input === 'bone_blocks' || farm.bone_input === 'both') ? baseKph / 9 : 0;
  const baseBlazes = baseKph / 12;
  const boneConsumption = baseBones + baseBoneBlocks;
  const boneStorageHours = (farm.bone_storage_items && boneConsumption > 0) ? farm.bone_storage_items / boneConsumption : null;
  const blazeStorageHours = (farm.blaze_storage_items && baseBlazes > 0) ? farm.blaze_storage_items / baseBlazes : null;
  return { kph, dkbPerHour, revenue, bonesPerHour, boneBlocksPerHour, blazesPerHour, boneCost, boneBlockCost, blazeCost, totalCostBones, totalCostBoneBlocks, totalCost, profitBones, profitBoneBlocks, profit, boneStorageHours, blazeStorageHours };
}

function storageDurStr(hours) {
  if (hours == null) return '—';
  // Round to nearest minute first to avoid floating point drift (e.g. 29h 59.99m)
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const E_KELP       = '<:kelp:1484297455603421354>';
const E_KELP_BLOCK = '<:dkb:1484299546812219422>';
const E_BONE_BLOCK = '<:bone_block:1484297457457434856>';
const E_CUSTOM_CHEST = '<:chest:1484302846995337377>';
const E_CUSTOM_BLAZE = '<:blaze:1484299548015984650>';
const E_PRICE = '<:price:1484668146177540298>';
const E_STATUS = '<:status:1484668380945584231>';
const E_BUILD = '<:build:1484668243309232331>';
const E_FARM = '<:farm:1484668192222744657>';
const E_VERIFY = '<:verify:1484668332740186265>';
const E_INFO = '<:info:1483973275720749226>';
const E_MEMBER = '<:member:1483972753991274587>';
const E_SENDER = '<:sender:1483975145461649428>';
const E_RECEIVER = '<:receive:1483973646581239939>';
const E_TIME = '<:time:1483972812015276063>';
const E_BONES      = '<:bones:1479885705542107178>';
const E_BLAZE      = E_CUSTOM_BLAZE;
const E_EMERALD    = '<:emerald:1484297628387901621>';
const E_SHULKER    = '<:shulker:1484297452701089802>';
const E_REDSTONE   = '<:redstone:1479869870442152087>';
const E_SMOKER     = '<:smoker:1484297448699728104>';
const E_CHEST      = E_CUSTOM_CHEST;
const E_COBBLE     = '<:cobblestone:1484297620124991519>';

function autoStorageLabel(items, hours) {
  if (!items) return '—';
  const itemStr = fmtNum(items);
  const durStr = storageDurStr(hours);
  return `${itemStr} | ${durStr}`;
}

function buildKelpFarmEmbed(farm, prices, multiplier = 1) {
  const s = calcKelpFarmStats(farm, prices, multiplier);
  const boneLabel = { bones: `${E_BONES} Bone`, bone_blocks: `${E_BONE_BLOCK} Bone Block`, both: `${E_BONES} ${E_BONE_BLOCK} Bone/Block` }[farm.bone_input] || farm.bone_input;
  const testedLabel = farm.tested ? '✅ Tested and working' : '⚠️ Untested';

  const _pl = perLabel(multiplier);
  // Bone/Block storage: only show the relevant one based on bone_input
  const _showBones      = farm.bone_input === 'bones' || farm.bone_input === 'both';
  const _showBoneBlocks = farm.bone_input === 'bone_blocks' || farm.bone_input === 'both';
  const _boneStorageEmoji = _showBoneBlocks ? E_BONE_BLOCK : E_BONES;

  const desc = [
    `__**INFO**__`,
    `${boneLabel}`,
    `${E_CHEST} Storage: ${autoStorageLabel(farm.bone_storage_items, s.boneStorageHours)}`,
    `${E_SMOKER} Smokers: ${farm.smokers}`,
    `${E_COBBLE} Size: ${farm.size}`,
    ``,
    `__**LOADERS**__`,
    `${E_SHULKER} ${farm.blaze_loaders} Blaze loaders`,
    `${E_SHULKER} ${farm.bone_loaders} Bone loaders`,
    ``,
    `__**PRODUCTION**__`,
    `${E_KELP} Kelp: **${fmtNum(s.kph)}** ${_pl}`,
    ``,
    `__**DRIED KELP**__`,
    `${E_KELP_BLOCK} Dried Kelp Blocks: **${fmtNum(s.dkbPerHour)}** ${_pl}`,
    ``,
    `__**RATES**__`,
    `${E_EMERALD} Revenue: **${fmtNum(s.revenue)}** ${_pl}`,
    ...(_showBones      ? [`${E_BONES} Bones: **${fmtNum(s.bonesPerHour)}** ${_pl}`] : []),
    ...(_showBoneBlocks ? [`${E_BONE_BLOCK} Bone Blocks: **${fmtNum(s.boneBlocksPerHour)}** ${_pl}`] : []),
    `${E_BLAZE} Blaze Rods: **${fmtNum(s.blazesPerHour)}** ${_pl}`,
    ...(farm.bone_input === 'both' ? [
      `${E_EMERALD} Cost (Bones): **${fmtNum(s.totalCostBones)}** ${_pl}`,
      `${E_EMERALD} Cost (Bone Blocks): **${fmtNum(s.totalCostBoneBlocks)}** ${_pl}`,
      `${E_EMERALD} Profit (Bones): **${fmtNum(s.profitBones)}** ${_pl}`,
      `${E_EMERALD} Profit (Bone Blocks): **${fmtNum(s.profitBoneBlocks)}** ${_pl}`,
    ] : [
      `${E_EMERALD} Cost: **${fmtNum(s.totalCost)}** ${_pl}`,
      `${E_EMERALD} Profit: **${fmtNum(s.profit)}** ${_pl}`,
    ]),
    ``,
    `__**STORAGE DURATION**__`,
    `${E_CHEST} Bone/Block storage: **${storageDurStr(s.boneStorageHours)}**`,
    `${E_CHEST} Blaze storage: **${storageDurStr(s.blazeStorageHours)}**`,
    ``,
    `__**CREDITS**__`,
    `👤 Designer: ${farm.designerMention || farm.designer}`,
    testedLabel,
  ].join('\n');

  const eb = new EmbedBuilder()
    .setColor(0x1a1c1f)
    .setTitle(farm.name)
    .setDescription(desc)
    .setFooter({ text: `${farm.name}  •  ${perLabel(multiplier)}  •  ID: ${farm.id}` });
  if (farm.imageUrl) eb.setImage(farm.imageUrl);
  return eb;
}

function buildCatalogComponents(multiplier) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('catdownload').setLabel('Download Schematic').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('catmultselect').setLabel(`⚙️ ${perLabel(multiplier)}`).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('catback').setLabel('Back to Catalog').setStyle(ButtonStyle.Secondary),
    ),
  ];
}

function buildCatalogDropdown(farms) {
  const options = farms.slice(0, 25).map(f => ({
    label: f.name.slice(0, 100),
    description: `${f.designer} • ${f.tested ? 'Tested' : 'Untested'} • ${f.size}`.slice(0, 100),
    value: f.id,
  }));
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('catselect')
        .setPlaceholder('Select a kelp farm…')
        .addOptions(options)
    ),
  ];
}

const catalogNavCache = new Map();

async function refreshCatalogPanel(channel) {
  try {
    const farms = await store.listCatalogFarms('kelp');
    const panelId = await store.getCatalogPanel(channel.id);
    let msg = panelId ? await channel.messages.fetch(panelId).catch(() => null) : null;
    if (!farms.length) {
      const empty = new EmbedBuilder().setColor(0x1a1c1f).setTitle('Kelp Farm Catalog').setDescription('No farms added yet. Staff can use `/kelp farm add`.');
      if (msg) await msg.edit({ embeds: [empty], components: [] }).catch(() => {});
      else { msg = await channel.send({ embeds: [empty] }); await store.setCatalogPanel(channel.id, msg.id); }
      return true;
    }
    const eb = new EmbedBuilder()
      .setColor(0x1a1c1f)
      .setTitle('Kelp Farm Catalog')
      .setDescription(`${farms.length} farm${farms.length !== 1 ? 's' : ''} available. Select one below to view details.`);
    const components = buildCatalogDropdown(farms);
    if (msg) await msg.edit({ embeds: [eb], components });
    else { msg = await channel.send({ embeds: [eb], components }); await store.setCatalogPanel(channel.id, msg.id); }
    return true;
  } catch (e) { console.error('[catalog] panel error:', e.message); return false; }
}
// ═══════════════════════════════════════════════════════════════════════════

// --- CONFIG ---
const SCHEMATIC_TICKET_CATEGORY_ID = C.TICKET_CATEGORIES.SCHEMATICS;
const SCHEMATIC_PANEL_EMBED_TITLE = 'Schematic Purchase Panel';

const MOD_LOG_CHANNEL_ID = C.CHANNEL_MOD_LOG;
const PAYMENT_LOG_CHANNEL_ID = C.CHANNEL_CONFIRMED_PAY || C.CHANNEL_PAYMENT_LOG;

// --- BUILDER BOARD CONFIG ---
const BUILDER_ROLE_IDS = ["1472623228231876842","1472623563893768316"];

async function buildBuildersBoardEmbeds(guild) {
  await guild.members.fetch().catch(() => {});
  const members = guild.members.cache
    .filter(m => !m.user.bot)
    .filter(m => m.roles.cache.some(r => BUILDER_ROLE_IDS.includes(r.id)))
    .map(m => m);

  const workMap = await store.listBuilderWork(guild.id).catch(() => ({}));

  const refreshed = workMap || {};
  const rows = members.map(m => {
    const w = refreshed[m.id];
    const etaEnd = w?.etaEnd ? Number(w.etaEnd) : null;
    const taskName = w?.taskName ? String(w.taskName).slice(0, 48) : null;
    const isBuilding = Boolean(taskName);

    let etaLabel = null;
    let late = false;
    if (isBuilding && etaEnd) {
      const now = Date.now();
      if (now >= etaEnd) { late = true; etaLabel = "**LATE**"; }
      else etaLabel = `<t:${Math.floor(etaEnd/1000)}:R>`;
    }

    return {
      id: m.id,
      name: sanitizeDisplayName(m.displayName || m.user.username, { maxLen: 28 }),
      isBuilding,
      late,
      etaLabel,
      taskName
    };
  });

  rows.sort((a,b)=>{
    if (a.isBuilding !== b.isBuilding) return a.isBuilding ? -1 : 1;
    if (a.late !== b.late) return a.late ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const building = rows.filter(r => r.isBuilding);
  const idle = rows.filter(r => !r.isBuilding);

  const linesBuilding = building.length
    ? building.map(r => {
        const statusChip = r.late ? "🔴" : "🟡";
        const task = r.taskName ? ` — ${r.taskName}` : "";
        const eta = r.etaLabel ? ` — ${r.etaLabel}` : "";
        return `${statusChip} ${r.name}${task}${eta}`;
      }).join("\n")
    : "✅ *No active builds right now.*";

  const linesIdle = idle.length
    ? idle.map(r => `⚪ ${r.name}`).join("\n")
    : "—";

  const eb = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle("Builder Board")
    .setDescription(
      `BUILDING (${building.length})\n${linesBuilding}\n\n` +
      `AVAILABLE (${idle.length})\n${linesIdle}`
    )
    .setFooter({ text: "Auto-updates • ETA uses Discord relative time" })
    .setTimestamp();

  return [eb];
}

async function refreshBuildersBoard(guild) {
  const board = await store.getBuilderBoard(guild.id).catch(() => null);
  if (!board?.channelId || !board?.messageId) return false;
  const channel = await guild.channels.fetch(board.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return false;
  const msg = await channel.messages.fetch(board.messageId).catch(() => null);
  if (!msg) return false;
  const embeds = await buildBuildersBoardEmbeds(guild);
  await msg.edit({ embeds }).catch(() => {});
  return true;
}
const LEVEL_UP_CHANNEL_ID = C.CHANNEL_LEVEL_UP;

// --- TICKETS + APPLICATIONS SYSTEM ---
const TICKET_SYSTEM_DEFAULT_GUILD_ID = process.env.GUILD_ID || null;

const COLOR_NAME_TO_DISCORD = {
  Blue: Colors.Blue,
  Aqua: Colors.Aqua,
  Cyan: Colors.Aqua,
  LightBlue: Colors.Blue,
  Green: Colors.Green,
  Red: Colors.Red,
  Yellow: Colors.Yellow,
  Purple: Colors.Purple,
  Orange: Colors.Orange,
  Grey: Colors.Grey,
  Gray: Colors.Grey,
  Default: Colors.Blurple,
};

const STYLE_NAME_TO_BUTTON = {
  Primary: ButtonStyle.Primary,
  Secondary: ButtonStyle.Secondary,
  Success: ButtonStyle.Success,
  Danger: ButtonStyle.Danger,
};

function ticketColor(colorName) {
  return COLOR_NAME_TO_DISCORD[colorName] ?? Colors.Blurple;
}
function buttonStyle(styleName) {
  return STYLE_NAME_TO_BUTTON[styleName] ?? ButtonStyle.Secondary;
}

function formatTemplate(s, vars) {
  if (!s) return s;
  return String(s).replace(/\{(\w+)\}/g, (_,k)=> (vars?.[k] ?? `{${k}}`));
}

function buildQuestionsModal(customId, title, questions, existing={}) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title.slice(0,45));
  const qs = (questions||[]).slice(0,5); // Discord max 5 inputs per modal
  for (const q of qs) {
    const input = new TextInputBuilder()
      .setCustomId(q.id)
      .setLabel((/^ign:?$/i.test(String(q.label||'').trim()) ? 'What is your IGN?' : q.label).slice(0,45))
      .setStyle((q.style||"Short")==="Paragraph" ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(!!q.required);
    if (typeof q.min === "number") input.setMinLength(Math.max(0, q.min));
    if (typeof q.max === "number") input.setMaxLength(Math.min(4000, q.max));
    const val = existing[q.id];
    if (val) input.setValue(String(val).slice(0,4000));
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }
  return modal;
}

// Ticket runtime helpers
function isStaffMember(member, cfg) {
  if (!member) return false;
  const configured = Array.isArray(cfg?.staffRoleIds) ? cfg.staffRoleIds.map(String) : [];
  const builtIn = [
    C.ROLE_OWNER,
    C.ROLE_CO_OWNER,
    C.ROLE_ADMIN,
    C.ROLE_MANAGER,
    C.ROLE_STAFF,
    C.ROLE_CHIEF_MOD,
    C.ROLE_MOD,
    C.ROLE_TRIAL_MOD,
  ].filter(Boolean).map(String);
  const staffIds = [...new Set([...configured, ...builtIn])];
  if (member.permissions?.has?.(PermissionsBitField.Flags.Administrator)) return true;
  return member.roles?.cache?.some?.(r => staffIds.includes(String(r.id))) || false;
}

function isBuilderMember(member) {
  if (!member) return false;
  return member.roles?.cache?.some?.(r => [
    C.ROLE_BUILDER_1,
    C.ROLE_BUILDER_2,
    C.ROLE_BUILDER_3,
    C.ROLE_BUILDER_TIER_1,
    C.ROLE_BUILDER_TIER_2,
    C.ROLE_BUILDER_TIER_3,
  ].filter(Boolean).includes(r.id)) || false;
}

function canManageStaffList(member) {
  if (!member) return false;
  if (member.permissions?.has?.(PermissionsBitField.Flags.Administrator)) return true;
  if (member.permissions?.has?.(PermissionsBitField.Flags.ManageGuild)) return true;
  const allowed = [C.ROLE_OWNER, C.ROLE_CO_OWNER, C.ROLE_ADMIN, C.ROLE_MANAGER].filter(Boolean);
  return member.roles?.cache?.some?.(r => allowed.includes(r.id)) || false;
}

async function simpleTicketLog(guild, cfg, text) {
  try {
    const chId = cfg?.logChannelId || MOD_LOG_CHANNEL_ID;
    const ch = await guild.channels.fetch(chId).catch(()=>null);
    if (ch && ch.isTextBased()) await ch.send({ content: text }).catch(()=>{});
  } catch {}

}

const TICKET_LOG_CHANNEL_ID = C.CHANNEL_TICKET_LOG;
const MEMBER_ROLE_ID = '1483225250698105069';
const SPAWNER_TICKET_ACCESS_ROLE_ID = '1484300107703648337';
const STAFF_LIST_CHANNEL_ID = '1484518287596322879';
const SCHEMATIC_HELPER_ROLE_ID = C.ROLE_SCHEMATIC_HELPER || '1504603126580252873';
const SPAWNER_PRICES_CHANNEL_ID = C.CHANNEL_SPAWNER_PRICES || '1483225252581343336';
const SCHEMATIC_FORUM_CHANNEL_ID = C.CHANNEL_SCHEMATIC_FORUM || '1504844039546208386';
const SCHEMATIC_SUBMISSION_LINK_CHANNEL_ID = C.CHANNEL_SCHEMATIC_SUBMISSION_LINK || '1483225252581343334';
const SCHEMATIC_FORUM_AUTO_ARCHIVE_MIN = 10080; // 7 days — Discord's longest
const STAFF_CHANGE_LOG_CHANNEL_ID = C.CHANNEL_STAFF_CHANGE_LOG || '1483225252292067484';

// Spawner type registry — used by the spawner-prices panel, /spawner command,
// and ticket-creation flow. `key` is the slug used for ticket names and DB
// lookups (zombified_piglin slugifies to "piglin" per request).
const SPAWNER_TYPES = [
  { key: 'skeleton',         label: 'Skeleton',         shortName: 'skeleton',   emoji: '<:skeleton:1491774177693143231>' },
  { key: 'creeper',          label: 'Creeper',          shortName: 'creeper',    emoji: '<:Creeper:1491635122586259477>' },
  { key: 'zombified_piglin', label: 'Zombified Piglin', shortName: 'piglin',     emoji: '<:piglin:1504843201641451640>' },
  { key: 'cow',              label: 'Cow',              shortName: 'cow',        emoji: '<:cows:1504843396898885642>' },
  { key: 'pig',              label: 'Pig',              shortName: 'pig',        emoji: '<:pigs:1504843413189558474>' },
  { key: 'spider',           label: 'Spider',           shortName: 'spider',     emoji: '<:spiders:1504843581171433607>' },
  { key: 'zombie',           label: 'Zombie',           shortName: 'zombie',     emoji: '🧟' },
  { key: 'iron_golem',       label: 'Iron Golem',       shortName: 'iron-golem', emoji: '🤖' },
  { key: 'blaze',            label: 'Blaze',            shortName: 'blaze',      emoji: '<:blaze:1484299548015984650>' },
];

function getSpawnerType(key) {
  return SPAWNER_TYPES.find(t => t.key === String(key || '').toLowerCase()) || null;
}

// Minimum quantity per spawner type for purchase tickets. Skeleton has a
// hard floor of 32; other types allow ≥1 but the embed still advertises 32 min.
const SPAWNER_MIN_QTY = { skeleton: 32 };
function spawnerMinQtyFor(typeKey) {
  return SPAWNER_MIN_QTY[String(typeKey || '').toLowerCase()] || 1;
}

function fmtSpawnerPrice(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  if (v >= 1_000_000_000) return `${+(v / 1_000_000_000).toFixed(2)}b`;
  if (v >= 1_000_000)     return `${+(v / 1_000_000).toFixed(2)}m`;
  if (v >= 1_000)         return `${+(v / 1_000).toFixed(2)}k`;
  return String(Math.round(v));
}

function parseSpawnerPrice(str) {
  if (str == null) return null;
  const s = String(str).trim().toLowerCase().replace(/,/g, '');
  // Strict: optional digits with one decimal, optional k/m/b suffix.
  // Anything malformed (e.g. "1.5.2k", "abc") is rejected.
  const m = s.match(/^(\d+(?:\.\d+)?)\s*([kmb])?$/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (m[2] === 'k') n *= 1_000;
  else if (m[2] === 'm') n *= 1_000_000;
  else if (m[2] === 'b') n *= 1_000_000_000;
  return Math.round(n);
}

function hasSpawnerTicketAccess(member) {
  return !!member?.roles?.cache?.has(SPAWNER_TICKET_ACCESS_ROLE_ID);
}

function isSpawnerTicketChannel(channel) {
  const pid = channel?.parentId;
  return [C.TICKET_CATEGORIES.SPAWNER_BUY, C.TICKET_CATEGORIES.SPAWNER_SELL].includes(pid);
}

// Build the spawner prices embed from the current price map. Always uses the
// same color, title, notes, and emoji order so /spawner command edits in place.
function buildSpawnerPricesEmbed(prices) {
  const buyLines = [];
  const sellLines = [];
  for (const t of SPAWNER_TYPES) {
    const row = prices?.[t.key] || {};
    const buy = fmtSpawnerPrice(row.buy);
    const sell = fmtSpawnerPrice(row.sell);
    if (buy)  buyLines.push(`${t.emoji} ${t.label} **${buy}** each`);
    if (sell) sellLines.push(`${t.emoji} ${t.label} **${sell}** each`);
  }
  const buyBlock  = buyLines.length  ? `### Buying:\n${buyLines.join('\n')}`   : '### Buying:\n*No active buy prices.*';
  const sellBlock = sellLines.length ? `### Selling:\n${sellLines.join('\n')}` : '### Selling:\n*No active sell prices.*';
  const desc = [
    buyBlock,
    sellBlock,
    '',
    '### Notes',
    '> Our Prices Are **NOT** Negotiable',
    '> **64 By 64** At Least',
    '> 32 Spawner **MINIMUM**',
    '',
    'Open a ticket below',
  ].join('\n');
  return new EmbedBuilder()
    .setTitle('Spawner Prices')
    .setColor(0x08a4a7)
    .setDescription(desc);
}

function buildSpawnerPanelComponents() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('spawner_open:buy').setLabel('Buy Spawners').setStyle(ButtonStyle.Secondary).setEmoji('📥'),
    new ButtonBuilder().setCustomId('spawner_open:sell').setLabel('Sell Spawners').setStyle(ButtonStyle.Secondary).setEmoji('📤'),
  );
  return [row];
}

// Publish or refresh the spawner-prices panel in the configured channel.
// Returns { channel, message } when successful, null otherwise.
async function refreshSpawnerPricesPanel(guild) {
  if (!guild) return null;
  const channel = await guild.channels.fetch(SPAWNER_PRICES_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isTextBased?.()) return null;
  const prices = await store.getSpawnerPrices().catch(() => ({}));
  const embed = buildSpawnerPricesEmbed(prices);
  const components = buildSpawnerPanelComponents();
  const ref = await store.getSpawnerPanelRef().catch(() => null);
  let msg = null;
  if (ref?.channelId === channel.id && ref?.messageId) {
    msg = await channel.messages.fetch(ref.messageId).catch(() => null);
  }
  if (msg) {
    await msg.edit({ embeds: [embed], components }).catch(() => {});
  } else {
    msg = await channel.send({ embeds: [embed], components }).catch(() => null);
    if (msg) await store.setSpawnerPanelRef({ channelId: msg.channelId, messageId: msg.id }).catch(() => {});
  }
  return msg ? { channel, message: msg } : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE BLOCK: SCHEMATIC SUBMISSIONS
// ═══════════════════════════════════════════════════════════════════════════

const SCHEMATIC_MAX_BODY_CHARS = 2000;

// Split a multi-line free-form input into bullet points, ignoring blank lines.
function bulletize(text) {
  if (!text) return [];
  return String(text)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

// Parse a designers paragraph into one Discord mention per line. Accepts
// `<@id>`, `<@!id>`, plain numeric ID, or raw text. Plain text falls through
// unchanged so submitters can write IGNs if they want.
function parseDesignerLines(text) {
  const lines = bulletize(text);
  return lines.map(line => {
    const idMatch = line.match(/^<@!?(\d{16,20})>$/) || line.match(/^(\d{16,20})$/);
    if (idMatch) return `<@${idMatch[1]}>`;
    return line;
  });
}

function buildSchematicBody(sub) {
  const sections = [];
  const designers = parseDesignerLines(sub.designers || '');
  if (designers.length) sections.push(`**Designers**\n${designers.map(d => `• ${d}`).join('\n')}`);

  if (sub.credits && bulletize(sub.credits).length) {
    sections.push(`**Credits**\n${bulletize(sub.credits).map(c => `• ${c}`).join('\n')}`);
  }
  if (sub.rates && bulletize(sub.rates).length) {
    sections.push(`**Rates**\n${bulletize(sub.rates).map(r => `• ${r}`).join('\n')}`);
  }
  if (sub.consumes && bulletize(sub.consumes).length) {
    sections.push(`**Consumes**\n${bulletize(sub.consumes).map(c => `• ${c}`).join('\n')}`);
  }
  if (sub.positives && bulletize(sub.positives).length) {
    sections.push(`**Positives**\n${bulletize(sub.positives).map(p => `• ${p}`).join('\n')}`);
  }
  if (sub.negatives && bulletize(sub.negatives).length) {
    sections.push(`**Negatives**\n${bulletize(sub.negatives).map(n => `• ${n}`).join('\n')}`);
  }

  const instructions = [];
  if (sub.build && String(sub.build).trim()) instructions.push(`**Build**\n${String(sub.build).trim()}`);
  if (sub.howto && String(sub.howto).trim()) instructions.push(`**How to use**\n${String(sub.howto).trim()}`);
  if (instructions.length) sections.push(`**Instructions**\n\n${instructions.join('\n\n')}`);

  let body = sections.join('\n\n');
  if (body.length > SCHEMATIC_MAX_BODY_CHARS) {
    body = body.slice(0, SCHEMATIC_MAX_BODY_CHARS - 1).trimEnd() + '…';
  }
  return body;
}

function buildSchematicEmbed(sub, { forPreview = false } = {}) {
  const eb = new EmbedBuilder()
    .setColor(0x08a4a7)
    .setTitle(sub.name || 'Untitled Schematic');
  const body = buildSchematicBody(sub);

  if (forPreview) {
    // Prominent upload-status header so submitters can see at a glance
    // whether they still need to drop a .litematic. Sits above the body
    // because Discord renders embed description top-to-bottom.
    const litematicLine = sub.litematicUrl
      ? `📎 **Schematic File** ✅ \`${sub.litematicName || 'uploaded.litematic'}\``
      : `📎 **Schematic File** ❌ Drop a \`.litematic\` in this channel to upload`;
    const renderLine = sub.renderUrl
      ? `🖼️ **Render** ✅ Ready`
      : `🖼️ **Render** ⏳ Awaiting \`.litematic\` upload`;
    const header = `${litematicLine}\n${renderLine}\n\n───\n\n`;
    eb.setDescription((header + (body || '')).slice(0, 4000));
  } else if (body) {
    eb.setDescription(body);
  }

  if (sub.renderUrl) eb.setImage(sub.renderUrl);
  if (forPreview) {
    const charCount = (body || '').length;
    eb.setFooter({ text: `Draft • body ${charCount}/${SCHEMATIC_MAX_BODY_CHARS} chars${sub.renderUrl ? ' • render ready' : ''}` });
  }
  return eb;
}

function buildSchematicPreviewComponents(sub) {
  const editRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`publish_edit_basics:${sub.id}`).setLabel('Edit Basics').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
    new ButtonBuilder().setCustomId(`publish_edit_extras:${sub.id}`).setLabel('Edit Extras').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    new ButtonBuilder().setCustomId(`publish_rerender:${sub.id}`).setLabel('Re-render').setStyle(ButtonStyle.Secondary).setEmoji('🔄'),
  );
  const isPublished = sub.status === 'PUBLISHED';
  const publishRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`publish_post:${sub.id}`)
      .setLabel(isPublished ? 'Update Forum Post' : 'Publish to Forum')
      .setStyle(isPublished ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setEmoji(isPublished ? '🔁' : '📤'),
  );
  return [editRow, publishRow];
}

// Build the basics modal (name, designers, rates, build, how-to-use) prefilled
// with the submission's current values.
function buildSchematicBasicsModal(sub) {
  const modal = new ModalBuilder()
    .setCustomId(`publish_modal_basics:${sub.id}`)
    .setTitle('Submit Schematic — Basics');
  const fields = [
    { id: 'name',      label: 'Schematic Name',                    style: TextInputStyle.Short,     required: true,  max: 80,   value: sub.name },
    { id: 'designers', label: 'Designers (one @mention/line)',     style: TextInputStyle.Paragraph, required: true,  max: 500,  value: sub.designers },
    { id: 'rates',     label: 'Rates (one per line, optional)',    style: TextInputStyle.Paragraph, required: false, max: 800,  value: sub.rates },
    { id: 'build',     label: 'Build instructions (optional)',     style: TextInputStyle.Paragraph, required: false, max: 1500, value: sub.build },
    { id: 'howto',     label: 'How to use',                        style: TextInputStyle.Paragraph, required: true,  max: 1500, value: sub.howto },
  ];
  for (const f of fields) {
    const input = new TextInputBuilder()
      .setCustomId(f.id)
      .setLabel(f.label)
      .setStyle(f.style)
      .setRequired(f.required)
      .setMaxLength(f.max);
    if (f.value && String(f.value).trim()) input.setValue(String(f.value).slice(0, f.max));
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }
  return modal;
}

// Build the extras modal (credits, consumes, positives, negatives) prefilled
// with the submission's current values. All four fields are optional.
function buildSchematicExtrasModal(sub) {
  const modal = new ModalBuilder()
    .setCustomId(`publish_modal_extras:${sub.id}`)
    .setTitle('Submit Schematic — Extras');
  const fields = [
    { id: 'credits',   label: 'Credits (Name: what they did)',   style: TextInputStyle.Paragraph, required: false, max: 800, value: sub.credits },
    { id: 'consumes',  label: 'Consumes (one per line)',         style: TextInputStyle.Paragraph, required: false, max: 800, value: sub.consumes },
    { id: 'positives', label: 'Positives (one per line)',        style: TextInputStyle.Paragraph, required: false, max: 800, value: sub.positives },
    { id: 'negatives', label: 'Negatives (one per line)',        style: TextInputStyle.Paragraph, required: false, max: 800, value: sub.negatives },
  ];
  for (const f of fields) {
    const input = new TextInputBuilder()
      .setCustomId(f.id)
      .setLabel(f.label)
      .setStyle(f.style)
      .setRequired(f.required)
      .setMaxLength(f.max);
    if (f.value && String(f.value).trim()) input.setValue(String(f.value).slice(0, f.max));
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }
  return modal;
}

async function postOrUpdateSchematicDraftPreview(channel, sub) {
  const embed = buildSchematicEmbed(sub, { forPreview: true });
  const components = buildSchematicPreviewComponents(sub);
  if (sub.draftMessageId) {
    const existing = await channel.messages.fetch(sub.draftMessageId).catch(() => null);
    if (existing) {
      await existing.edit({ embeds: [embed], components }).catch(() => {});
      return existing;
    }
  }
  const msg = await channel.send({ embeds: [embed], components }).catch(() => null);
  if (msg) {
    await store.updateSchematicSubmission(sub.id, { draftMessageId: msg.id }).catch(() => {});
    try { await msg.pin(); } catch (e) { console.error('[schematic draft] pin error:', e?.message); }
  }
  return msg;
}

// Find the most-recent .litematic attachment in a ticket channel (within the
// last 50 messages). Returns { url, name, message } or null.
async function findLatestLitematicAttachment(channel) {
  const recent = await channel.messages.fetch({ limit: 50 }).catch(() => null);
  if (!recent) return null;
  for (const msg of recent.values()) {
    for (const a of msg.attachments.values()) {
      if (/\.litematic$/i.test(a.name || a.url || '')) {
        return { url: a.url, name: a.name || 'schematic.litematic', message: msg };
      }
    }
  }
  return null;
}

// Download a URL into a Buffer (used for re-attaching the .litematic to the
// forum post and for piping into the renderer).
async function downloadToBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Run the existing litematic renderer on a .litematic buffer; returns the PNG
// buffer. Throws on failure.
async function renderLitematicToPng(buffer) {
  const renderer = getLitematicRender();
  const { png } = await renderer.renderLitematic(buffer, {});
  return png;
}

// Re-render the .litematic uploaded in this ticket, attach the PNG to the
// draft preview, and persist its URL on the submission. Returns the updated
// submission record or null on failure.
async function regenerateSchematicRender(channel, sub) {
  const found = await findLatestLitematicAttachment(channel);
  if (!found) return { ok: false, reason: 'No .litematic file found in this ticket. Upload one first.' };
  try {
    const litematicBuf = await downloadToBuffer(found.url);
    const renderBuf = await renderLitematicToPng(litematicBuf);
    // Upload render as a fresh message attachment so we get a stable Discord CDN URL.
    const renderMsg = await channel.send({
      files: [new AttachmentBuilder(renderBuf, { name: 'render.png' })],
    }).catch(() => null);
    const renderUrl = renderMsg?.attachments?.first()?.url || null;
    const updated = await store.updateSchematicSubmission(sub.id, {
      renderUrl,
      renderMessageId: renderMsg?.id || null,
      litematicUrl: found.url,
      litematicName: found.name,
      updatedAt: Date.now(),
    });
    await postOrUpdateSchematicDraftPreview(channel, updated || sub).catch(() => {});
    return { ok: true, submission: updated || sub };
  } catch (e) {
    return { ok: false, reason: `Render failed: ${e?.message || e}` };
  }
}

// Returns true if the channel is in the Publish Schematic ticket category.
function isPublishSchematicTicketChannel(channel) {
  return channel?.parentId === C.TICKET_CATEGORIES.PUBLISH_SCHEMATIC;
}

function canManageSchematicSubmission(member) {
  if (!member) return false;
  if (member.permissions?.has?.(PermissionsBitField.Flags.Administrator)) return true;
  if (member.permissions?.has?.(PermissionsBitField.Flags.ManageGuild)) return true;
  const roles = member.roles?.cache;
  if (!roles) return false;
  return (
    roles.has(SCHEMATIC_HELPER_ROLE_ID) ||
    (C.ROLE_ADMIN && roles.has(C.ROLE_ADMIN)) ||
    (C.ROLE_MANAGER && roles.has(C.ROLE_MANAGER))
  );
}

// Pull Discord user IDs out of a designers paragraph. Each line typically
// looks like `<@123>` or `<@!123>` — plain text falls through ignored.
function parseDesignerUserIds(text) {
  if (!text) return [];
  const ids = new Set();
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/<@!?(\d{16,20})>/);
    if (m) ids.add(m[1]);
  }
  return [...ids];
}

// Edit access for a submission: original submitter, any mentioned designer,
// or a schematic manager. Lets designers fix typos / replace .litematics
// straight from the forum thread after the ticket is closed.
function isAuthorizedToEditSubmission(member, sub) {
  if (!member || !sub) return false;
  if (canManageSchematicSubmission(member)) return true;
  if (String(member.user?.id || member.id) === String(sub.submitterId)) return true;
  const designerIds = parseDesignerUserIds(sub.designers);
  return designerIds.includes(String(member.user?.id || member.id));
}

// Publish a submission to the forum OR update the existing thread in place if
// one was already created (idempotent — designers can run `/publish post`
// after fixing typos and the same thread is updated).
async function publishOrUpdateSchematicForumPost(guild, sub) {
  const forum = await guild.channels.fetch(SCHEMATIC_FORUM_CHANNEL_ID).catch(() => null);
  if (!forum || forum.type !== ChannelType.GuildForum) {
    return { ok: false, reason: `Schematic forum <#${SCHEMATIC_FORUM_CHANNEL_ID}> is unreachable or not a forum channel.` };
  }

  if (!sub.renderUrl || !sub.litematicUrl) {
    return { ok: false, reason: 'Missing render or .litematic — upload a .litematic and run /publish render.' };
  }

  let renderBuf, litematicBuf;
  try {
    renderBuf    = await downloadToBuffer(sub.renderUrl);
    litematicBuf = await downloadToBuffer(sub.litematicUrl);
  } catch (e) {
    return { ok: false, reason: `Could not fetch source files: ${e?.message || e}` };
  }

  const embed = buildSchematicEmbed(sub, { forPreview: false });
  embed.setImage('attachment://render.png');

  // Edit button on the starter message — gives designers a way to fix typos
  // or replace the .litematic long after the original ticket is closed.
  const editRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`publish_edit_forum:${sub.id}`).setLabel('Edit').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
  );

  // If the submission already references a forum thread, try to edit that
  // thread's starter message in place. Falls through to creating a new thread
  // if the original was deleted manually.
  let thread = null;
  if (sub.forumThreadId) {
    thread = await forum.threads.fetch(sub.forumThreadId).catch(() => null);
  }

  if (thread) {
    // If the thread is archived, un-archive before editing so designers don't
    // hit a "thread is archived" error on subsequent edits.
    if (thread.archived) {
      try { await thread.setArchived(false); } catch {}
    }
    const starter = await thread.fetchStarterMessage().catch(() => null);
    if (starter) {
      try {
        await starter.edit({
          embeds: [embed],
          files: [
            new AttachmentBuilder(renderBuf, { name: 'render.png' }),
            new AttachmentBuilder(litematicBuf, { name: sub.litematicName || `${sub.id}.litematic` }),
          ],
          components: [editRow],
        });
        // Rename the thread if the schem was renamed.
        if (sub.name && thread.name !== sub.name.slice(0, 100)) {
          await thread.setName(sub.name.slice(0, 100)).catch(() => {});
        }
        // Sync attachment URLs to the new starter so subsequent edits don't
        // 404 on a deleted ticket's stale URLs.
        const freshStarter = await thread.fetchStarterMessage().catch(() => null);
        const atts = freshStarter ? [...freshStarter.attachments.values()] : [];
        const renderAtt = atts.find(a => /\.png$/i.test(a.name || ''));
        const litematicAtt = atts.find(a => /\.litematic$/i.test(a.name || ''));
        await store.updateSchematicSubmission(sub.id, {
          status: 'PUBLISHED',
          publishedAt: sub.publishedAt || Date.now(),
          updatedAt: Date.now(),
          renderUrl: renderAtt?.url || sub.renderUrl,
          litematicUrl: litematicAtt?.url || sub.litematicUrl,
        }).catch(() => {});
        return { ok: true, thread, updated: true };
      } catch (e) {
        return { ok: false, reason: `Forum edit failed: ${e?.message || e}` };
      }
    }
  }

  // Fresh post.
  try {
    thread = await forum.threads.create({
      name: (sub.name || sub.id).slice(0, 100),
      autoArchiveDuration: SCHEMATIC_FORUM_AUTO_ARCHIVE_MIN,
      message: {
        embeds: [embed],
        files: [
          new AttachmentBuilder(renderBuf, { name: 'render.png' }),
          new AttachmentBuilder(litematicBuf, { name: sub.litematicName || `${sub.id}.litematic` }),
        ],
        components: [editRow],
      },
    });
  } catch (e) {
    return { ok: false, reason: `Forum post failed: ${e?.message || e}` };
  }

  const starter = await thread.fetchStarterMessage().catch(() => null);
  const newAtts = starter ? [...starter.attachments.values()] : [];
  const renderNew = newAtts.find(a => /\.png$/i.test(a.name || ''));
  const litematicNew = newAtts.find(a => /\.litematic$/i.test(a.name || ''));
  await store.updateSchematicSubmission(sub.id, {
    status: 'PUBLISHED',
    forumThreadId: thread.id,
    forumStarterMessageId: starter?.id || null,
    publishedAt: Date.now(),
    updatedAt: Date.now(),
    renderUrl: renderNew?.url || sub.renderUrl,
    litematicUrl: litematicNew?.url || sub.litematicUrl,
  }).catch(() => {});

  return { ok: true, thread, updated: false };
}

// Delete the forum thread and reset publication state on the submission.
async function retireSchematicForumPost(guild, sub) {
  if (!sub.forumThreadId) {
    return { ok: false, reason: 'This submission has not been published yet.' };
  }
  const forum = await guild.channels.fetch(SCHEMATIC_FORUM_CHANNEL_ID).catch(() => null);
  if (forum) {
    const thread = await forum.threads.fetch(sub.forumThreadId).catch(() => null);
    if (thread) {
      try { await thread.delete('Schematic unposted via /publish unpost'); }
      catch (e) { return { ok: false, reason: `Could not delete thread: ${e?.message || e}` }; }
    }
  }
  await store.updateSchematicSubmission(sub.id, {
    status: 'DRAFT',
    forumThreadId: null,
    forumStarterMessageId: null,
    updatedAt: Date.now(),
  }).catch(() => {});
  return { ok: true };
}

// Pull the existing forum schematic into this ticket's submission record so
// the designer can edit and re-publish without creating a duplicate.
async function importSchematicFromThread(guild, threadIdOrUrl, currentSub) {
  const m = String(threadIdOrUrl || '').match(/(\d{16,20})/);
  if (!m) return { ok: false, reason: 'Could not parse a thread id from that input.' };
  const threadId = m[1];

  const forum = await guild.channels.fetch(SCHEMATIC_FORUM_CHANNEL_ID).catch(() => null);
  if (!forum || forum.type !== ChannelType.GuildForum) {
    return { ok: false, reason: 'Schematic forum is unreachable.' };
  }
  const thread = await forum.threads.fetch(threadId).catch(() => null);
  if (!thread || thread.parentId !== SCHEMATIC_FORUM_CHANNEL_ID) {
    return { ok: false, reason: 'Thread not found in the schematic forum.' };
  }

  // Find the source submission by forumThreadId.
  let source = null;
  const all = await store.listSchematicSubmissions().catch(() => ({}));
  for (const sub of Object.values(all || {})) {
    if (String(sub?.forumThreadId || '') === String(threadId)) { source = sub; break; }
  }

  if (!source) {
    // No record — fall back to copying the thread title only.
    await store.updateSchematicSubmission(currentSub.id, {
      name: thread.name,
      forumThreadId: threadId,
      updatedAt: Date.now(),
    }).catch(() => {});
    return { ok: true, partial: true, warning: 'No prior submission record found — only the thread name was imported. Re-upload the .litematic and refill the fields.' };
  }

  await store.updateSchematicSubmission(currentSub.id, {
    name:        source.name,
    designers:   source.designers,
    credits:     source.credits,
    rates:       source.rates,
    consumes:    source.consumes,
    positives:   source.positives,
    negatives:   source.negatives,
    build:       source.build,
    howto:       source.howto,
    litematicUrl:  source.litematicUrl,
    litematicName: source.litematicName,
    renderUrl:     source.renderUrl,
    forumThreadId: threadId,
    forumStarterMessageId: source.forumStarterMessageId || null,
    status: 'DRAFT',
    importedFrom: source.id,
    updatedAt: Date.now(),
  }).catch(() => {});

  return { ok: true, partial: false };
}

async function ensureSchematicGuidelinesPost(guild) {
  try {
    const forum = await guild.channels.fetch(SCHEMATIC_FORUM_CHANNEL_ID).catch(() => null);
    if (!forum || forum.type !== ChannelType.GuildForum) return;
    const ref = await store.getSchematicGuidelinesRef().catch(() => null);
    if (ref?.guildId === guild.id && ref?.threadId) {
      const existing = await forum.threads.fetch(ref.threadId).catch(() => null);
      if (existing) return; // already created
    }
    const thread = await forum.threads.create({
      name: '📌 How to submit a schematic',
      autoArchiveDuration: SCHEMATIC_FORUM_AUTO_ARCHIVE_MIN,
      message: {
        embeds: [new EmbedBuilder()
          .setColor(0x08a4a7)
          .setTitle('How to submit a schematic')
          .setDescription([
            `Open a ticket in <#${SCHEMATIC_SUBMISSION_LINK_CHANNEL_ID}> using the **Publish Schematic** button.`,
            '',
            'You will be asked for:',
            '• Schematic name',
            '• Designers',
            '• Build instructions',
            '• How to use it',
            '• Rates (optional)',
            '',
            'Drop your `.litematic` file in the ticket and the bot will render an isoview automatically.',
            '',
            'A schematic manager will review and post the finalized version here.',
          ].join('\n'))],
      },
    }).catch(e => { console.error('[schematic guidelines] create error:', e?.message); return null; });
    if (!thread) return;
    try { await thread.pin(); } catch (e) { console.error('[schematic guidelines] pin error:', e?.message); }
    await store.setSchematicGuidelinesRef({ guildId: guild.id, threadId: thread.id }).catch(() => {});
  } catch (e) {
    console.error('[schematic guidelines] ensure error:', e?.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════

function canAccessTicketChannel(channel, member) {
  if (!channel || !member) return false;
  try {
    return !!channel.permissionsFor(member)?.has(PermissionsBitField.Flags.ViewChannel);
  } catch {
    return false;
  }
}

const TICKET_UI = {
  color: 0x08A4A7,
  id: '<:number:1483972904210141294>',
  openedBy: '<:open:1483972944257355806>',
  closedBy: '<:close:1483972861776363560>',
  time: '<:time:1483972812015276063>',
  claimedBy: '<:member:1483972753991274587>',
  reason: '<:reason:1483972786606309437>',
  chat: '<:chat:1483972713377828925>',
  lock: '<:locks:1483972687792570568>',
  unlock: '<:unlocks:1483977002020110336>',
};

function buildClosedTicketEmbed({ ticketId, creatorId, closerId, openedAt, claimedById, reason, channelName }) {
  const eb = new EmbedBuilder()
    .setColor(TICKET_UI.color)
    .setTitle('Ticket Closed')
    .addFields(
      { name: `${TICKET_UI.id} Ticket ID`, value: String(ticketId || '—'), inline: true },
      { name: `${TICKET_UI.openedBy} Opened By`, value: creatorId ? `<@${creatorId}>` : '—', inline: true },
      { name: `${TICKET_UI.closedBy} Closed By`, value: closerId ? `<@${closerId}>` : 'Staff', inline: true },
      { name: `${TICKET_UI.time} Open Time`, value: openedAt ? `<t:${Math.floor(Number(openedAt) / 1000)}:f>` : '—', inline: true },
      { name: `${TICKET_UI.claimedBy} Claimed By`, value: claimedById ? `<@${claimedById}>` : 'Not claimed', inline: true },
      { name: `${TICKET_UI.reason} Reason`, value: reason ? String(reason).slice(0, 1024) : 'No reason specified', inline: false },
    )
    .setTimestamp();
  if (channelName) eb.setFooter({ text: String(channelName).slice(0, 100) });
  return eb;
}

function buildTicketDmEmbed({ title, description, channelId, extraFields = [] }) {
  const eb = new EmbedBuilder()
    .setColor(TICKET_UI.color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
  const fields = [];
  if (channelId) fields.push({ name: `${TICKET_UI.chat} Channel`, value: `<#${channelId}>`, inline: true });
  for (const f of extraFields) if (f?.name && f?.value) fields.push(f);
  if (fields.length) eb.addFields(fields);
  return eb;
}

// Back-compat: some older builds referenced `ticketLog`.
// Keep it defined to avoid ReferenceError if any leftover references exist.
const ticketLog = TICKET_LOG_CHANNEL_ID;

// buildTicketLogRow / upsertTicketLog are superseded by the in-memory transcript
// attachment sent directly in closeTicket(). Kept as no-ops to avoid ReferenceError.
function buildTicketLogRow() { return []; }
async function upsertTicketLog() {}



// ── Resolve category ID for a hardcoded panel from DB config ─────────────────
async function resolvePanelCategory(guildId, panelId) {
  const catKeyMap = {
    'building_services': ['CAT_BUILDING', 'TICKET_CATEGORIES_BUILDING'],
    'spawner_sell':      ['CAT_SPAWNER_SELL'],
    'spawner_buy':       ['CAT_SPAWNER_BUY', 'TICKET_CATEGORIES_SCHEMATICS'],
    'support':           ['CAT_SUPPORT'],
    'gw_claim':          ['CAT_GW_CLAIM'],
    'farm_help':         ['CAT_FARM_HELP'],
    'publish_schematic': ['CAT_PUBLISH_SCHEMATIC'],
    'scam_report':       ['CAT_SCAM_REPORT'],
  };
  const keys = catKeyMap[panelId] || [];
  for (const k of keys) {
    const v = await store.getConfigValue(guildId, k).catch(() => null);
    if (v && v.length > 5) return v;
  }
  return null;
}

// Safe channel fetch — returns null if id is empty/invalid instead of fetching guild
async function safeFetchChannel(guild, id) {
  if (!id || String(id).length < 5) return null;
  return guild.channels.fetch(String(id)).catch(() => null);
}

function withTimeout(promise, ms, fallbackValue) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
}

const vouchboardUserPages = new Map(); // userId -> page index
const pendingVouchReason = new Map(); // voucherUserId -> targetUserId

async function buildTranscriptText(channel, limit=500) {
  const lines = [];
  let lastId = null;
  let fetched = 0;
  while (fetched < limit) {
    const batch = await channel.messages.fetch({ limit: Math.min(100, limit - fetched), before: lastId || undefined }).catch(()=>null);
    if (!batch || batch.size === 0) break;
    const arr = Array.from(batch.values());
    for (const m of arr) {
      const ts = new Date(m.createdTimestamp).toISOString().replace("T"," ").slice(0,19);
      let content = m.content || "";
      if (m.attachments?.size) {
        for (const a of m.attachments.values()) {
          content += ` [Attachment] ${a.name || "file"} (${a.url})`;
        }
      }
      lines.push(`[${ts}] ${m.author?.tag || m.author?.id}: ${content}`);
    }
    fetched += batch.size;
    lastId = arr[arr.length - 1].id;
    if (batch.size < 100) break;
  }
  return lines.reverse().join("\n");
}

function ticketControlRow(claimedById) {
  const closeBtn = new ButtonBuilder()
    .setCustomId("tk_close")
    .setLabel("Close")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("🔒");

  const claimBtn = new ButtonBuilder()
    .setCustomId(claimedById ? "tk_unclaim" : "tk_claim")
    .setLabel(claimedById ? "Unclaim" : "Claim")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(claimedById ? "🙌" : "🙌");

  return new ActionRowBuilder().addComponents(closeBtn, claimBtn);
}


const TICKET_EMOJIS = {
  claimed:   "🟡",
  unclaimed: "🔴",
  building:  "🟠",
  done:      "🟢",
};

// Format price as abbreviated string for channel names (e.g. 1500000 → "1.5m")
function fmtAmount(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return '0';
  if (v >= 1e12) return `${+(v / 1e12).toFixed(1)}t`;
  if (v >= 1e9)  return `${+(v / 1e9).toFixed(1)}b`;
  if (v >= 1e6)  return `${+(v / 1e6).toFixed(1)}m`;
  if (v >= 1e3)  return `${+(v / 1e3).toFixed(1)}k`;
  return String(Math.round(v));
}

// Slugify a string for channel name use
function slugify(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

const BUILDING_TICKET_CATEGORY_ID = C.TICKET_CATEGORIES.BUILDING;

// All known ticket categories — used for fallback record creation
const ALL_TICKET_CATEGORY_IDS = new Set(Object.values(C.TICKET_CATEGORIES).filter(Boolean));

// Role IDs for ticket permission tiers
const _STAFF_ROLE      = C.ROLE_STAFF;
const _ADMIN_ROLE      = C.ROLE_ADMIN;
const _MANAGER_ROLE    = C.ROLE_MANAGER;
const _CHIEF_MOD_ROLE  = C.ROLE_CHIEF_MOD;
const _MOD_ROLE        = C.ROLE_MOD;
const _TRIAL_MOD_ROLE  = C.ROLE_TRIAL_MOD;
const _MOD_AND_ABOVE   = [_ADMIN_ROLE, _MANAGER_ROLE, _CHIEF_MOD_ROLE, _MOD_ROLE, _TRIAL_MOD_ROLE];

// Extra viewer roles per category (strict allowlist — only these roles see the category)
// Format: categoryId -> [roleId, ...]
const CATEGORY_EXTRA_VIEWER_ROLES = {
  // General + extra support categories — Staff + full mod chain
  [C.TICKET_CATEGORIES.GENERAL_1]: [_STAFF_ROLE, _ADMIN_ROLE, _MANAGER_ROLE, _CHIEF_MOD_ROLE, _MOD_ROLE],
  [C.TICKET_CATEGORIES.GENERAL_2]: [_STAFF_ROLE, _ADMIN_ROLE, _MANAGER_ROLE, _CHIEF_MOD_ROLE, _MOD_ROLE],
  // Mod-only categories — Trial Mod and above
  [C.TICKET_CATEGORIES.MOD_1]: [..._MOD_AND_ABOVE, C.ROLE_TRIAL_MOD].filter(Boolean),
  [C.TICKET_CATEGORIES.MOD_2]: [..._MOD_AND_ABOVE, C.ROLE_TRIAL_MOD].filter(Boolean),
  // Builder category — all builder roles + Trial Mod and above
  [C.TICKET_CATEGORIES.BUILDING]: [C.ROLE_BUILDER_1, C.ROLE_BUILDER_2, C.ROLE_BUILDER_3, ..._MOD_AND_ABOVE].filter(Boolean),
  // Spawner categories — full staff chain (incl. Support/Trial Mod) plus the
  // dedicated spawner-ticket access role.
  [C.TICKET_CATEGORIES.SPAWNER_BUY]: [_STAFF_ROLE, _ADMIN_ROLE, _MANAGER_ROLE, _CHIEF_MOD_ROLE, _MOD_ROLE, _TRIAL_MOD_ROLE, SPAWNER_TICKET_ACCESS_ROLE_ID].filter(Boolean),
  [C.TICKET_CATEGORIES.SPAWNER_SELL]: [_STAFF_ROLE, _ADMIN_ROLE, _MANAGER_ROLE, _CHIEF_MOD_ROLE, _MOD_ROLE, _TRIAL_MOD_ROLE, SPAWNER_TICKET_ACCESS_ROLE_ID].filter(Boolean),
  // Farm Help + Publish Schematic — staff + schematic-helper role
  [C.TICKET_CATEGORIES.FARM_HELP]: [_STAFF_ROLE, _ADMIN_ROLE, _MANAGER_ROLE, _CHIEF_MOD_ROLE, _MOD_ROLE, SCHEMATIC_HELPER_ROLE_ID].filter(Boolean),
  [C.TICKET_CATEGORIES.PUBLISH_SCHEMATIC]: [_STAFF_ROLE, _ADMIN_ROLE, _MANAGER_ROLE, _CHIEF_MOD_ROLE, _MOD_ROLE, SCHEMATIC_HELPER_ROLE_ID].filter(Boolean),
  // Scam Report — staff only, same access as Support
  [C.TICKET_CATEGORIES.SCAM_REPORT]: [_STAFF_ROLE, _ADMIN_ROLE, _MANAGER_ROLE, _CHIEF_MOD_ROLE, _MOD_ROLE].filter(Boolean),
};

function isBuildingTicketChannel(channel, rec) {
  // Prefer live channel parentId; fall back to stored record if present.
  const parentId = channel?.parentId || rec?.categoryId || null;
  return String(parentId || '') === String(BUILDING_TICKET_CATEGORY_ID);
}

// Returns a ticket record for this channel — creates a minimal one if missing
// but the channel is in a known ticket category (fixes "not a ticket channel" for old tickets)
async function getOrBootstrapTicketRecord(channelId, channel) {
  let rec = await store.getTicketRecord(channelId).catch(() => null);
  if (rec) return rec;
  // If channel is in a known ticket category, auto-create a minimal record so commands work
  const parentId = channel?.parentId;
  if (parentId && ALL_TICKET_CATEGORY_IDS.has(String(parentId))) {
    const minRec = {
      channelId,
      guildId: channel.guildId,
      creatorId: null,
      panelId: 'legacy',
      buttonId: 'legacy',
      label: 'Legacy Ticket',
      createdAt: channel.createdTimestamp || Date.now(),
      status: 'OPEN',
      claimedById: null,
      claimedAt: null,
      ticketType: 'normal',
      builderId: null,
      etaEnd: null,
      controlMessageId: null,
      ticketNum: null,
      channelBaseName: (channel.name || 'ticket').replace(/^(🟡|🔴|🟢|🟠)\s*/u, '').split('-').slice(0, 2).join('-'),
      claimerUsername: null,
      buildFarmName: null,
      buildAmount: null,
    };
    await store.createTicketRecord(channelId, minRec).catch(() => {});
    return minRec;
  }
  return null;
}

function ticketStatusEmoji(rec) {
  const type = String(rec?.ticketType || "normal");
  if (type === "done" || type === "paid") return TICKET_EMOJIS.done;
  if (type === "building") return TICKET_EMOJIS.building;
  return rec?.claimedById ? TICKET_EMOJIS.claimed : TICKET_EMOJIS.unclaimed;
}

// Compute the full desired channel name for a building-category ticket based on its state.
function buildingTicketDesiredName(rec) {
  const type = String(rec?.ticketType || "normal");
  const claimerSlug = rec?.claimerUsername ? slugify(rec.claimerUsername) : null;
  const baseName = rec?.channelBaseName || 'build';
  const useManualBase = !!rec?.manualRename;
  const base = useManualBase ? baseName : (claimerSlug || baseName);

  if (type === "done" || type === "paid") {
    const amt = rec?.buildAmount ? fmtAmount(rec.buildAmount) : 'done';
    return `${TICKET_EMOJIS.done}-${base}-${amt}`.slice(0, 100);
  }
  if (type === "building") {
    const detail = rec?.buildAmount
      ? fmtAmount(rec.buildAmount)
      : (rec?.buildFarmName ? slugify(rec.buildFarmName) : 'building');
    return `${TICKET_EMOJIS.building}-${base}-${detail}`.slice(0, 100);
  }
  if (rec?.claimedById) {
    return `${TICKET_EMOJIS.claimed}-${base}`.slice(0, 100);
  }
  return baseName.slice(0, 100);
}

async function safeUpdateTicketControls(channel, claimedById, rec) {
  try {
    if (!channel) return;
    let msg = null;
    if (rec?.controlMessageId) {
      msg = await channel.messages.fetch(String(rec.controlMessageId)).catch(() => null);
    }
    if (!msg) {
      const recent = await channel.messages.fetch({ limit: 50 }).catch(() => null);
      if (recent) {
        msg = recent.find(m => m.author?.id === channel.client.user?.id && Array.isArray(m.components) && m.components.length);
      }
    }
    if (msg) {
      await msg.edit({ components: [ticketControlRow(claimedById)] }).catch(() => {});
      // Keep the canonical control message pinned — except in spawner tickets,
      // where only the price/info embed should occupy the pinned slot.
      if (!isSpawnerTicketChannel(channel)) {
        try { if (!msg.pinned) await msg.pin(); } catch {}
      }
      if (!rec?.controlMessageId || String(rec.controlMessageId) !== String(msg.id)) {
        await store.updateTicketRecord(channel.id, { controlMessageId: msg.id }).catch(() => {});
      }
    }
  } catch {}
}

// Ticket rename queue: handles Discord's 2-renames-per-10-min rate limit
// We keep a per-channel queue so pending renames always use the latest desired name.
if (!global.__ticketRenameQueues) global.__ticketRenameQueues = new Map();
if (!global.__ticketRenameHistory) global.__ticketRenameHistory = new Map(); // channelId -> [ts1, ts2]

async function syncTicketChannelName(channel, rec, opts = {}) {
  // opts: { notifyChannel, commandLabel } — used to send a "rate limited, retry in X" embed
  try {
    if (!channel || !rec) return;
    const latestStored = channel?.id ? await store.getTicketRecord(channel.id).catch(() => null) : null;
    const effectiveRec = latestStored ? { ...rec, ...latestStored } : rec;
    const current = channel.name || '';

    let desired;
    if (!isBuildingTicketChannel(channel, effectiveRec)) {
      const base = String(effectiveRec?.channelBaseName || current || 'ticket')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'ticket';
      desired = base.slice(0, 100);
    } else {
      desired = buildingTicketDesiredName(effectiveRec).slice(0, 100);
    }

    if (current === desired) return;

    const queues = global.__ticketRenameQueues;
    if (queues.has(channel.id)) {
      queues.get(channel.id).desired = desired;
      return;
    }

    const notifyCh = opts.notifyChannel || channel;

    const doRename = async (targetName) => {
      const hist = global.__ticketRenameHistory.get(channel.id) || [];
      const now = Date.now();
      const window = hist.filter(t => now - t < 10 * 60 * 1000);
      global.__ticketRenameHistory.set(channel.id, window);

      if (window.length >= 2) {
        // Rate limited — notify in channel with future name and timestamp, then queue
        const availableAt = window[0] + 10 * 60 * 1000 + 1000;
        const waitMs = Math.max(1000, availableAt - now);
        try {
          const notifMsg = await notifyCh.send({
            embeds: [new EmbedBuilder()
              .setColor(0xFFA500)
              .setDescription(`**${targetName}** — renaming ${tsR(availableAt)}.`)]
          }).catch(() => null);
          queues.set(channel.id, { desired: targetName, notifMsg });
        } catch {}
        setTimeout(async () => {
          const q = queues.get(channel.id);
          const name = q?.desired || targetName;
          const prevNotif = q?.notifMsg;
          queues.delete(channel.id);
          try {
            const fresh = await channel.guild.channels.fetch(channel.id).catch(() => null);
            if (fresh && fresh.name !== name) await doRename(name);
            if (prevNotif) prevNotif.delete().catch(() => {});
          } catch {}
        }, Math.min(waitMs, 11 * 60 * 1000));
        return;
      }

      window.push(now);
      global.__ticketRenameHistory.set(channel.id, window);

      try {
        await channel.setName(targetName);
      } catch (e) {
        const retryAfter = (e?.rawError?.retry_after ?? e?.retryAfter ?? 0) * 1000 || 11 * 60 * 1000;
        const h2 = global.__ticketRenameHistory.get(channel.id) || [];
        global.__ticketRenameHistory.set(channel.id, h2.filter(t => t !== now));

        queues.set(channel.id, { desired: targetName });
        setTimeout(async () => {
          const q = queues.get(channel.id);
          const name = q?.desired || targetName;
          queues.delete(channel.id);
          try {
            const fresh = await channel.guild.channels.fetch(channel.id).catch(() => null);
            if (fresh && fresh.name !== name) await doRename(name);
          } catch {}
        }, Math.min(retryAfter, 12 * 60 * 1000));
      }
    };

    await doRename(desired);
  } catch {}
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

// Interaction-safe responder: if already deferred/replied, edit; otherwise reply.
// NOTE: discord.js v14+ is moving away from {flags: 64} in favor of message flags.
// To avoid "ephemeral is deprecated" warnings (and future breakage), normalize to flags:64.
async function safeIReply(interaction, payload) {
  const p0 = payload || {};
  const wantsEphemeral = (p0.ephemeral === true) || (p0.flags === 64);
  const normalized = { ...p0 };
  if (wantsEphemeral) {
    delete normalized.ephemeral;
    normalized.flags = 64;
  }
  const { flags, ephemeral, ...rest } = normalized;

  try {
    if (interaction.deferred) return await interaction.editReply(rest);
    if (interaction.replied) return await interaction.followUp(normalized);
    return await interaction.reply(normalized);
  } catch {
    try {
      if (!interaction.replied && !interaction.deferred) return await interaction.reply(normalized);
    } catch {}
    try {
      if (interaction.deferred) return await interaction.editReply(rest);
    } catch {}
    try {
      return await interaction.followUp(normalized);
    } catch {}
  }
}

function panelButtonEmoji(panelId, keyOrLabel) {
  const s = String(keyOrLabel || '').toLowerCase();
  const p = String(panelId || '').toLowerCase();

  // Panel-specific overrides
  if (p === 'schematic_purchase' && /purchase/.test(s)) return '💰';

  // Global ticket panel emojis
  if (/^other$/.test(s) || /support/.test(s)) return '⚠️';
  if (/spawner/.test(s) && /(buy|sell)/.test(s)) return '💀';
  if ((/giveaway|gw/.test(p) || /giveaway|gw/.test(s)) && /claim/.test(s)) return '🎊';
  if (/farm.*help/.test(s)) return '🌱';
  if (/publish.*schematic/.test(s)) return '📦';
  if (/scam/.test(s)) return '🔴';

  return null;
}

async function createTicketChannel({ interaction, panelId, buttonKey, btnCfg, answers, extraTopLine, creatorUser, openerUser, nameOverride, skipPinControl }) {
  const guild = interaction.guild;
  const cfg = await store.getTicketConfig();
  const ticketNum = await store.nextTicketId();
  const creator = creatorUser || interaction.user;
  const opener = openerUser || interaction.user;
  const categoryId = btnCfg.categoryId;
  const username = creator.username;
  const baseName = nameOverride
    ? String(nameOverride).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 90)
    : `${btnCfg.key || buttonKey}-${username}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 90);
  const name = (`${baseName || btnCfg.key || buttonKey || "ticket"}`).slice(0, 92);
  // Building tickets start with 🔴 + name (e.g. 🔴base-username, 🔴mining-username).
  // The emoji updates to 🟡/🟠/🟢 via syncTicketChannelName as status changes.
  // Resolve building category ID from DB first, fall back to config.js
  const dbBuildingCatId = await store.getConfigValue(guild.id, 'CAT_BUILDING').catch(() => null)
    || await store.getConfigValue(guild.id, 'TICKET_CATEGORIES_BUILDING').catch(() => null);
  const effectiveBuildingCatId = (dbBuildingCatId && dbBuildingCatId.length > 5)
    ? dbBuildingCatId
    : (BUILDING_TICKET_CATEGORY_ID && BUILDING_TICKET_CATEGORY_ID.length > 5 ? BUILDING_TICKET_CATEGORY_ID : '');
  const isBuilding = effectiveBuildingCatId && String(categoryId) === String(effectiveBuildingCatId);
  const finalName = isBuilding ? `${TICKET_EMOJIS.unclaimed}${name}`.slice(0, 100) : name;

  // ── Permission rules ─────────────────────────────────────────────────────
  // Building tickets: builder roles only. Spawner tickets: spawner allowlist only.
  const staffId   = await store.getConfigValue(guild.id, 'ROLE_STAFF').catch(() => null) || C.ROLE_STAFF;
  const chiefB    = await store.getConfigValue(guild.id, 'ROLE_CHIEF_BUILDER').catch(() => null) || C.ROLE_BUILDER_1;
  const trainedB  = await store.getConfigValue(guild.id, 'ROLE_TRAINED_BUILDER').catch(() => null) || C.ROLE_BUILDER_2;
  const traineeB  = await store.getConfigValue(guild.id, 'ROLE_TRAINEE_BUILDER').catch(() => null) || C.ROLE_BUILDER_3;

  let staffRoleIds   = filterCachedRoleIds([staffId, C.ROLE_ADMIN, C.ROLE_MANAGER, C.ROLE_CHIEF_MOD, C.ROLE_MOD, C.ROLE_TRIAL_MOD], guild.roles);
  let builderRoleIds = filterCachedRoleIds([chiefB, trainedB, traineeB], guild.roles);

  // Fall back to legacy config if DB not yet set
  if (!staffRoleIds.length) {
    const dbLegacy = await store.getConfigValue(guild.id, 'ROLES_STAFF_IDS').catch(() => null);
    const legacyIds = (dbLegacy || '').split(',').map(s => s.trim()).filter(s => s.length > 5);
    const cfgStaff = (cfg.staffRoleIds || []).filter(id => id && id.length > 5);
    staffRoleIds = filterCachedRoleIds([...staffRoleIds, ...legacyIds, ...cfgStaff], guild.roles);
  }

  const STAFF_ALLOW   = [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageMessages];
  const MEMBER_ALLOW  = [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles];
  const BOT_ALLOW     = [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageChannels];
  const botMember = guild.members.me || await guild.members.fetchMe().catch(() => null);

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    ...(botMember ? [{ id: botMember.id, allow: BOT_ALLOW }] : []),
    { id: creator.id, allow: MEMBER_ALLOW },
  ];

  const viewerRoleIds = filterCachedRoleIds(getTicketViewerRoleIds({
    buttonKey,
    isBuilding,
    staffRoleIds,
    builderRoleIds,
    spawnerRoleId: SPAWNER_TICKET_ACCESS_ROLE_ID,
    config: C,
  }), guild.roles);
  if (isSpawnerButton(buttonKey)) {
    const spawnerDenyRoleIds = filterCachedRoleIds([staffId, C.ROLE_STAFF, ...(cfg?.staffRoleIds || [])], guild.roles)
      .filter(rid => !viewerRoleIds.includes(rid));
    for (const rid of spawnerDenyRoleIds) {
      const role = guild.roles.cache.get(rid);
      if (role) overwrites.push({ id: role, deny: [PermissionsBitField.Flags.ViewChannel] });
    }
    // Farm Help + Publish Schematic — grant the schematic-helper role view+send
    // access only. Intentionally without ManageMessages — helpers shouldn't be
    // able to delete other users' messages.
    if (['farm_help', 'publish_schematic'].includes(String(buttonKey))) {
      const HELPER_ALLOW = [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
      ];
      overwrites.push({ id: SCHEMATIC_HELPER_ROLE_ID, allow: HELPER_ALLOW });
    }
  }
  for (const rid of viewerRoleIds) {
    const role = guild.roles.cache.get(rid);
    if (role) overwrites.push({ id: role, allow: STAFF_ALLOW });
  }

  const channel = await guild.channels.create({
    name: finalName,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: overwrites,
    topic: `Ticket #${ticketNum} | ${btnCfg.label} | Creator: ${creator.tag} (${creator.id})${opener.id !== creator.id ? ` | Opened by: ${opener.tag} (${opener.id})` : ''}`
  });
  const liveChannel = await fetchUsableTextChannel(guild, channel).catch(() => null);
  if (!liveChannel) {
    try { await channel.delete().catch(() => {}); } catch {}
    throw new Error('Ticket channel was created but Discord did not make it available in time.');
  }

  const vars = { userMention: `<@${creator.id}>` };
  const welcomeText = formatTemplate(btnCfg.welcome || "", vars);
  const eb = new EmbedBuilder()
    .setColor(0x08a4a7)
    .setTitle(btnCfg.label)
    .setDescription(`${welcomeText}`.trim());

  const fields = [];
  if (extraTopLine) fields.push({ name: "Selection", value: extraTopLine.slice(0,1024) });
  if (fields.length) eb.addFields(fields.slice(0, 25));

  // Ping routing follows the viewer allowlist.
  let staffPing = null;
  staffPing = viewerRoleIds.map(r => `<@&${r}>`).join(' ') || null;

  // Two-panel opener: Info, then Q&A (no numbering)
  const infoEmbed = eb;

  const qaEmbed = new EmbedBuilder()
    .setColor(0x08a4a7)
    .setTitle(btnCfg.label);

  const qaLines = [];
  const qList = Array.isArray(btnCfg.questions) ? btnCfg.questions : [];
  for (const q of qList) {
    const ans = answers?.[q.id];
    if (ans == null) continue;
    const v = String(ans).trim();
    if (!v) continue; // skip optional blanks
    // Requested: answers on their own line
    qaLines.push(`**${q.label}:**\n${v}`);
  }
  // Legacy fallback
  if (!qaLines.length && answers && Object.keys(answers).length) {
    for (const [k,v] of Object.entries(answers)) {
      const vv = String(v||"").trim();
      if (!vv) continue;
      qaLines.push(`**${k}:**\n${vv}`);
    }
  }
  // Join with a literal newline; previous build accidentally injected a raw newline into the string literal.
  if (qaLines.length) qaEmbed.setDescription(qaLines.join("\n\n").slice(0, 4000));

  const msg = await sendWithChannelRetry(guild, liveChannel, {
    content: [ `<@${creator.id}>`, staffPing ].filter(Boolean).join(" "),
    embeds: qaLines.length ? [infoEmbed, qaEmbed] : [infoEmbed],
    components: [ticketControlRow(null)]
  });

  // Pin the control message so staff always interact with the correct controls.
  // Spawner tickets opt out via skipPinControl — their price embed is pinned
  // separately so the first thing in pinned messages is the price info.
  if (!skipPinControl) {
    try { await msg.pin(); } catch {}
  }

  await store.createTicketRecord(liveChannel.id, {
    channelId: liveChannel.id, guildId: guild.id, creatorId: creator.id, openerId: opener.id, panelId, buttonId: buttonKey,
    label: btnCfg.label, createdAt: Date.now(), status: "OPEN", claimedById: null, claimedAt: null,
    ticketType: "normal", builderId: null, etaEnd: null, controlMessageId: msg.id, ticketNum,
    channelBaseName: (btnCfg.key || buttonKey || 'build').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30),
    claimerUsername: null, buildFarmName: null, buildAmount: null,
  });
  try { await store.recordTicketOpened(guild.id, opener.id); } catch {}

  return liveChannel;
}

async function createSupportTicketForUser({ interaction, targetUser, supportQuestion = null }) {
  const supportCategoryId = C.TICKET_CATEGORIES.SUPPORT || C.TICKET_CATEGORIES.GENERAL_1 || '';
  if (!supportCategoryId) throw new Error('Support category is not configured.');
  const existing = await store.findOpenTicketByUserButton(interaction.guildId, targetUser.id, 'ticket_center', 'support_manual').catch(() => null);
  if (existing) {
    const existingCh = await interaction.guild.channels.fetch(existing.channelId).catch(() => null);
    if (existingCh) return { channel: existingCh, duplicate: true };
    await store.updateTicketRecord(existing.channelId, { status: 'CLOSED' }).catch(() => {});
  }
  const btnCfg = {
    key: 'support',
    label: 'Support',
    categoryId: supportCategoryId,
    welcome: `Hello {userMention}, a staff member opened this support ticket for you.`,
    questions: supportQuestion ? [{ id: 'support_question', label: 'Support Question' }] : [],
  };
  const channel = await createTicketChannel({
    interaction,
    panelId: 'ticket_center',
    buttonKey: 'support_manual',
    btnCfg,
    answers: supportQuestion ? { support_question: supportQuestion } : {},
    creatorUser: targetUser,
    openerUser: interaction.user,
  });
  return { channel, duplicate: false };
}

async function getBlockingBuildJobForTicket(channelId) {
  try {
    const jobs = await store.listBuildJobs().catch(() => []);
    return jobs.find(job => String(job.ticketChannelId || '') === String(channelId) && ['PENDING', 'AWAITINGCONFIRM', 'AWAITINGPAYOUT'].includes(String(job.status || '').toUpperCase())) || null;
  } catch {
    return null;
  }
}

async function canCloseTicket(channelId) {
  const blockingJob = await getBlockingBuildJobForTicket(channelId);
  if (blockingJob) {
    return {
      ok: false,
      reason: `This ticket cannot be closed because payment was already confirmed for **${blockingJob.buildType || 'this build'}**, but the build is not complete yet.`
    };
  }
  return { ok: true, reason: null };
}

async function closeTicket({ guild, channel, closerId, reason }) {
  const cfg = await store.getTicketConfig();
  const rec = await store.getTicketRecord(channel.id);
  if (!rec || rec.status !== "OPEN") return false;
  const closeCheck = await canCloseTicket(channel.id);
  if (!closeCheck.ok) return false;
  const limit = cfg.transcriptLimit || 500;
  // Build transcript entirely in memory — no disk writes needed
  const transcript = await withTimeout(buildTranscriptText(channel, limit).catch(() => ""), 6000, "");

  await store.updateTicketRecord(channel.id, { status: "CLOSED", closedAt: Date.now(), closedById: closerId || null, closeReason: reason || null });

  // Staff stats: response time + closed count
  try {
    const r3 = await store.getTicketRecord(channel.id).catch(() => null);
    if (r3?.firstStaffMessageAt && r3?.createdAt && r3?.firstResponderId) {
      await store.recordTicketResponse(guild.id, r3.firstResponderId, r3.firstStaffMessageAt - r3.createdAt).catch(() => {});
    }
    const closedStaffId = (closerId && String(closerId)) || (r3?.claimedById ? String(r3.claimedById) : null);
    if (closedStaffId) {
      await store.recordTicketClosed(guild.id, closedStaffId).catch(() => {});
    }
  } catch {}
  // If this was a building assignment, clear builder state
  try {
    const rec2 = await store.getTicketRecord(channel.id).catch(()=>null);
    if (rec2?.ticketType === 'building' && rec2.builderId) {
      const w = await store.getBuilderWork(guild.id, rec2.builderId).catch(()=>null);
      if (w?.ticketChannelId === channel.id) await store.setBuilderWork(guild.id, rec2.builderId, null).catch(()=>{});
    }
  } catch {}
  // DM the ticket creator on close + post matching close log
  try {
    const closedRec2 = await store.getTicketRecord(channel.id).catch(() => rec);
    const closedEmbed = buildClosedTicketEmbed({
      ticketId: closedRec2?.ticketNum || channel.id,
      creatorId: closedRec2?.creatorId,
      closerId,
      openedAt: closedRec2?.createdAt,
      claimedById: closedRec2?.claimedById,
      reason,
      channelName: channel.name,
    });

    if (closedRec2?.creatorId) {
      const creator = await client.users.fetch(closedRec2.creatorId).catch(() => null);
      const dm = creator ? await creator.createDM().catch(() => null) : null;
      if (dm) {
        await dm.send({ embeds: [closedEmbed] }).catch(() => {});
      }
    }

    const logChId = await store.getConfigValue(guild.id, 'CHANNEL_TICKET_LOG').catch(() => null) || TICKET_LOG_CHANNEL_ID || '1483225253307220203';
    const logCh = logChId ? await guild.channels.fetch(logChId).catch(() => null) : null;
    if (logCh && logCh.isTextBased()) {
      const files = [];
      if (transcript) {
        const buf = Buffer.from(transcript, 'utf8');
        const namePart = slugify(channel.name || closedRec2?.label || 'ticket') || 'ticket';
        files.push(new AttachmentBuilder(buf, { name: `transcript-${closedRec2?.ticketNum || channel.id}-${namePart}.txt` }));
      }
      await logCh.send({ embeds: [closedEmbed], files }).catch(() => {});
    }
  } catch {}

  // Delete channel (record is kept for stats)
  const deleted = await withTimeout(channel.delete().then(() => true).catch(() => false), 6000, false);
  if (!deleted) {
    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone.id, { ViewChannel: false }).catch(() => {});
      await channel.permissionOverwrites.edit(rec.creatorId, { SendMessages: false }).catch(() => {});
      await channel.setName(`closed-${String(channel.name).slice(0, 90)}`.slice(0, 100)).catch(() => {});
      await channel.send({ content: "Ticket closed. (Bot lacks permission to delete this channel.)" }).catch(() => {});
    } catch {}
  }
  return true;
}

// --- TRANSCRIPT CLEANUP ---
// Transcripts are now sent in-memory to Discord and never written to disk.
// cleanupTranscriptsOnBoot kept as no-op for boot compatibility.
async function cleanupTranscriptsOnBoot() {}

const appSessions = new Map(); // userId -> session

// Build the action-row(s) for an application review embed.
//   ticketChannelId   — when set, the "Open Ticket" button is replaced with
//                       a "View Ticket" Discord link (no interaction needed).
//   includeDecisionButtons — false after the decision has been made;
//                       only the View Ticket link (if any) survives.
function buildAppReviewActionRows({ appId, ticketChannelId, guildId, includeDecisionButtons }) {
  const ticketUrl = (ticketChannelId && guildId)
    ? `https://discord.com/channels/${guildId}/${ticketChannelId}`
    : null;

  if (!includeDecisionButtons) {
    if (!ticketUrl) return [];
    return [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('View Ticket').setStyle(ButtonStyle.Link).setURL(ticketUrl),
    )];
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`app_decide:accept:${appId}`).setLabel('Accept').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`app_decide:deny:${appId}`).setLabel('Deny').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`app_decide:accept_reason:${appId}`).setLabel('Accept with reason').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`app_decide:deny_reason:${appId}`).setLabel('Deny with reason').setStyle(ButtonStyle.Danger),
    ticketUrl
      ? new ButtonBuilder().setLabel('View Ticket').setStyle(ButtonStyle.Link).setURL(ticketUrl)
      : new ButtonBuilder().setCustomId(`app_open_ticket:${appId}`).setLabel('Open Ticket').setStyle(ButtonStyle.Secondary),
  );
  return [row];
}
const acceptedStaffInfoSessions = new Map(); // userId -> accepted staff/builder IGN collection

async function getApplicationCooldown(userId, typeId) {
  if (!getApplicationRoleKind(typeId)) return { blocked: false, until: 0, remainingMs: 0, last: null };
  const tsys = await store.getTicketSystem().catch(() => null);
  const submissions = tsys?.applications?.submissions || {};
  return findApplicationCooldown({ submissions, userId, typeId, now: Date.now(), cooldownMs: APPLICATION_COOLDOWN_MS });
}

function applicationCooldownEmbed(typeTitle, cooldown) {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('Application cooldown')
    .setDescription(`You can submit one **${typeTitle || 'application'}** every 3 days.\n\nTry again ${tsR(cooldown.until)}.`);
}

function acceptedInfoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x08a4a7)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: 'Failure to comply will result in instant demotion.' });
}

function acceptedInfoSession({ userId, kind, sessionId = generateId(), appId = null, acceptedById = null, acceptedAt = Date.now() }) {
  return {
    sessionId,
    kind,
    userId,
    appId,
    acceptedById,
    acceptedAt,
    step: 'ign',
    ign: null,
    altCount: 0,
    alts: [],
  };
}

function getOrCreateAcceptedInfoSession(userId, kind, sessionId) {
  const existing = acceptedStaffInfoSessions.get(userId);
  if (existing?.sessionId === sessionId && existing?.kind === kind) return existing;
  const sess = acceptedInfoSession({ userId, kind, sessionId });
  acceptedStaffInfoSessions.set(userId, sess);
  return sess;
}

function acceptedMainIgnRow(kind, sessionId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accepted_info_main_open:${kind}:${sessionId}`)
      .setLabel('Enter IGN')
      .setStyle(ButtonStyle.Primary)
  );
}

function acceptedMainIgnModal(kind, sessionId) {
  return new ModalBuilder()
    .setCustomId(`accepted_info_main:${kind}:${sessionId}`)
    .setTitle('Staff Info')
    .addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('main_ign')
        .setLabel('Main IGN')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(16)
    ));
}

function acceptedAltIgnsModal(kind, sessionId, count) {
  const modal = new ModalBuilder()
    .setCustomId(`accepted_info_alts:${kind}:${sessionId}:${count}`)
    .setTitle('Alt IGNs');
  for (let i = 1; i <= count; i += 1) {
    modal.addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId(`alt_${i}`)
        .setLabel(`Alt IGN ${i}`)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(16)
    ));
  }
  return modal;
}

function altCountRow(kind, sessionId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`accepted_info_alt:${kind}:${sessionId}`)
    .setPlaceholder('Alt accounts')
    .addOptions([0, 1, 2, 3, 4, 5].map(n => ({ label: String(n), value: String(n) })));
  return new ActionRowBuilder().addComponents(menu);
}

function staffListTitle(kind) {
  return kind === 'builder' ? 'Builders' : 'Support Staff';
}

function buildAcceptedStaffListEmbed(kind, list) {
  const title = staffListTitle(kind);
  const rows = Object.values(list || {})
    .filter(Boolean)
    .sort((a, b) => Number(a.acceptedAt || a.updatedAt || 0) - Number(b.acceptedAt || b.updatedAt || 0));
  const description = rows.length
    ? rows.map((r, i) => {
      const alts = Array.isArray(r.alts) && r.alts.length ? `\n> Alts: ${r.alts.map(a => `\`${a}\``).join(', ')}` : '';
      return `**${i + 1}.** <@${r.userId}>\n> IGN: \`${r.ign || 'Pending'}\`${alts}`;
    }).join('\n\n')
    : 'No entries yet.';
  return new EmbedBuilder()
    .setColor(kind === 'builder' ? 0xFFB300 : 0x00A8FF)
    .setTitle(title)
    .setDescription(description.slice(0, 4096))
    .setTimestamp();
}

async function getAcceptedInfoRoleSets(guild) {
  const supportRoleIds = filterCachedRoleIds([
    await store.getConfigValue(guild.id, 'ROLE_STAFF').catch(() => null),
    await store.getConfigValue(guild.id, 'ROLE_SUPPORT').catch(() => null),
    C.ROLE_STAFF,
    C.ROLE_SUPPORT,
  ], guild.roles);
  const builderRoleIds = filterCachedRoleIds([
    await store.getConfigValue(guild.id, 'ROLE_BUILDER_TIER_1').catch(() => null),
    await store.getConfigValue(guild.id, 'ROLE_BUILDER_TIER_2').catch(() => null),
    await store.getConfigValue(guild.id, 'ROLE_BUILDER_TIER_3').catch(() => null),
    await store.getConfigValue(guild.id, 'ROLE_TRAINEE_BUILDER').catch(() => null),
    await store.getConfigValue(guild.id, 'ROLE_TRAINED_BUILDER').catch(() => null),
    await store.getConfigValue(guild.id, 'ROLE_CHIEF_BUILDER').catch(() => null),
    C.ROLE_BUILDER_TIER_1,
    C.ROLE_BUILDER_TIER_2,
    C.ROLE_BUILDER_TIER_3,
    C.ROLE_BUILDER_1,
    C.ROLE_BUILDER_2,
    C.ROLE_BUILDER_3,
  ], guild.roles);
  return { supportRoleIds, builderRoleIds };
}

async function getActiveAcceptedUserIds(guild, kind, roleSets) {
  await guild.members.fetch().catch(() => null);
  const roleIds = kind === 'builder' ? roleSets.builderRoleIds : roleSets.supportRoleIds;
  const active = new Set();
  for (const member of guild.members.cache.values()) {
    if (member.user?.bot) continue;
    if (member.roles?.cache?.some?.(r => roleIds.includes(r.id))) active.add(member.id);
  }
  return active;
}

async function refreshAcceptedStaffList(kind) {
  const ch = await client.channels.fetch(STAFF_LIST_CHANNEL_ID).catch(() => null);
  if (!ch?.isTextBased?.()) return;
  const data = await store.getAcceptedStaffList().catch(() => null);
  if (!data) return;
  const key = kind === 'builder' ? 'builders' : 'support';
  const messageKey = kind === 'builder' ? 'buildersMessageId' : 'supportMessageId';
  let list = data[key] || {};
  if (ch.guild) {
    const roleSets = await getAcceptedInfoRoleSets(ch.guild).catch(() => null);
    if (roleSets) {
      const activeUserIds = await getActiveAcceptedUserIds(ch.guild, kind, roleSets).catch(() => null);
      if (activeUserIds) {
        const pruned = getAcceptedStaffListPruneResult(list, activeUserIds);
        list = pruned.active;
        for (const userId of pruned.removed) {
          await store.deleteAcceptedStaffListEntry(kind, userId).catch(() => {});
        }
      }
    }
  }
  const embed = buildAcceptedStaffListEmbed(kind, list);
  let msg = data[messageKey] ? await ch.messages.fetch(data[messageKey]).catch(() => null) : null;
  if (msg) {
    await msg.edit({ embeds: [embed] }).catch(() => {});
    return;
  }
  msg = await ch.send({ embeds: [embed] }).catch(() => null);
  if (msg) await store.setAcceptedStaffListMessageId(kind, msg.id).catch(() => {});
}

async function saveAcceptedStaffInfo(userId) {
  const sess = acceptedStaffInfoSessions.get(userId);
  if (!sess?.ign) return;
  await store.setAcceptedStaffListEntry(sess.kind, userId, {
    userId,
    ign: sess.ign,
    alts: Array.isArray(sess.alts) ? sess.alts : [],
    appId: sess.appId,
    acceptedById: sess.acceptedById,
    acceptedAt: sess.acceptedAt,
    infoRequestedAt: sess.infoRequestedAt || Date.now(),
  }).catch(() => {});
  await refreshAcceptedStaffList(sess.kind).catch(() => {});
}

async function startAcceptedStaffInfoFlow({ user, submission, acceptedById, dm }) {
  const kind = getApplicationRoleKind(submission?.typeId);
  if (!kind || !user) return;
  const channel = dm || await user.createDM().catch(() => null);
  if (!channel) return;
  const sess = acceptedInfoSession({
    userId: user.id,
    kind,
    appId: submission.id,
    acceptedById,
    acceptedAt: Date.now(),
  });
  acceptedStaffInfoSessions.set(user.id, sess);
  await channel.send({
    embeds: [acceptedInfoEmbed(`${staffListTitle(kind)} Info`, 'Click below to enter your main Minecraft IGN.')],
    components: [acceptedMainIgnRow(kind, sess.sessionId)]
  }).catch(() => {});
}

async function requestAcceptedInfoForMember(member, kind) {
  if (!member || member.user?.bot || !kind) return false;
  const list = await store.getAcceptedStaffList().catch(() => null);
  const key = kind === 'builder' ? 'builders' : 'support';
  const existing = list?.[key]?.[member.id] || null;
  if (existing?.ign || existing?.infoRequestedAt) return false;

  const sess = acceptedInfoSession({
    userId: member.id,
    kind,
    appId: null,
    acceptedById: client.user?.id || null,
    acceptedAt: Date.now(),
  });
  sess.infoRequestedAt = Date.now();
  acceptedStaffInfoSessions.set(member.id, sess);
  const dm = await member.user.createDM().catch(() => null);
  if (!dm) return false;
  const sent = await dm.send({
    embeds: [acceptedInfoEmbed(`${staffListTitle(kind)} Info`, 'Click below to enter your main Minecraft IGN.')],
    components: [acceptedMainIgnRow(kind, sess.sessionId)]
  }).catch(() => null);
  if (!sent) return false;

  await store.setAcceptedStaffListEntry(kind, member.id, {
    userId: member.id,
    ign: null,
    alts: [],
    appId: null,
    acceptedById: client.user?.id || null,
    acceptedAt: sess.acceptedAt,
    infoRequestedAt: sess.infoRequestedAt,
  }).catch(() => {});
  return true;
}

async function sendAcceptedInfoBackfillForGuild(guild) {
  const roleSets = await getAcceptedInfoRoleSets(guild).catch(() => null);
  if (!roleSets) return;
  await guild.members.fetch().catch(() => null);
  let changed = false;
  for (const member of guild.members.cache.values()) {
    if (member.user?.bot) continue;
    const kind = getAcceptedInfoKindForRoleIds([...member.roles.cache.keys()], roleSets);
    if (!kind) continue;
    changed = (await requestAcceptedInfoForMember(member, kind).catch(() => false)) || changed;
  }
  if (changed) {
    await refreshAcceptedStaffList('support').catch(() => {});
    await refreshAcceptedStaffList('builder').catch(() => {});
  }
}

async function grantApplicationAcceptanceRoles({ guild, userId, typeId, reason }) {
  const kind = getApplicationRoleKind(typeId);
  if (!guild || !userId || !kind) return [];

  const roleConfig = {
    ...C,
    ROLE_STAFF: await store.getConfigValue(guild.id, 'ROLE_STAFF').catch(() => null) || C.ROLE_STAFF,
    ROLE_SUPPORT: await store.getConfigValue(guild.id, 'ROLE_SUPPORT').catch(() => null) || C.ROLE_SUPPORT || C.ROLE_TRIAL_MOD,
    ROLE_BUILDER_TIER_1: await store.getConfigValue(guild.id, 'ROLE_BUILDER_TIER_1').catch(() => null)
      || await store.getConfigValue(guild.id, 'ROLE_TRAINEE_BUILDER').catch(() => null)
      || C.ROLE_BUILDER_TIER_1
      || C.ROLE_BUILDER_3,
  };
  const roleIds = getApplicationAcceptanceRoleIds(kind, roleConfig);
  if (!roleIds.length) return [];

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return [];

  const missing = roleIds.filter(roleId => roleId && !member.roles.cache.has(roleId));
  if (!missing.length) return [];

  await member.roles.add(missing, reason || 'Application accepted');
  return missing;
}

async function sendApplicationDmConfirm({ guild, user, type }) {
  const dm = await user.createDM().catch(() => null);
  if (!dm) return null;

  const files = [];

  const eb = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(type.title || "Application")
    .setDescription(
      "Are you sure you want to apply?\n\n" + "Once you start the application I will send you a series of questions. " +
      "You will have **3 hours** to complete the application. " +
      "If you do not complete the application in time, you will have to restart. " +
      "If you wish to stop the application feel free to click the cancel button at any time."
    );


  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`app_dm_confirm:start:${type.id}:${guild.id}`).setLabel("Start application").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`app_dm_confirm:cancel:${type.id}:${guild.id}`).setLabel("Cancel application").setStyle(ButtonStyle.Danger)
  );

  await dm.send({ embeds: [eb], components: [row], files }).catch(() => {});
  return dm;
}

async function startApplicationDmFlow(interaction, typeId) {
  const guild = interaction.guild;
  const user = interaction.user;
  const cfg = await store.getTicketConfig();
  const type = await store.getAppType(typeId);
  if (!type) return;
  const cooldown = await getApplicationCooldown(user.id, typeId);
  if (cooldown.blocked) return false;

  // Persist id on type for confirm buttons
  type.id = typeId;

  const dm = await sendApplicationDmConfirm({ guild, user, type });
  if (!dm) return;

  appSessions.set(user.id, {
    typeId,
    guildId: guild.id,
    reviewChannelId: cfg.applicationsReviewChannelId || null,
    dmChannelId: dm.id,
    answers: {},
    qIndex: 0,
    awaiting: false,
    expiresAt: Date.now() + 3 * 60 * 60 * 1000
  });
  return true;
}

async function sendNextAppQuestion(userId) {
  const sess = appSessions.get(userId);
  if (!sess) return;
  const type = await store.getAppType(sess.typeId);
  if (!type) { appSessions.delete(userId); return; }
  const user = await client.users.fetch(userId).catch(() => null);
  if (!user) { appSessions.delete(userId); return; }

  const dm = await user.createDM().catch(() => null);
  if (!dm) { appSessions.delete(userId); return; }

  if (Date.now() > sess.expiresAt) {
    await dm.send({ embeds: [new EmbedBuilder().setColor(0xed4245).setTitle("Application timed out").setDescription("Please restart the application.")] }).catch(() => {});
    appSessions.delete(userId);
    return;
  }

  const qs = Array.isArray(type.questions) ? type.questions : [];
  const total = qs.length;
  if (sess.qIndex >= total) {
    // submit
    // Prefer session-stored review channel id (DM flows can lack a resolvable guild context)
    const reviewId = sess.reviewChannelId || (await store.getTicketConfig()).applicationsReviewChannelId || null;
    const reviewCh = reviewId ? await client.channels.fetch(reviewId).catch(() => null) : null;
    const appId = `${sess.typeId}-${userId}-${Date.now()}`;

    const reviewData = buildApplicationReviewEmbedData({
      typeTitle: type.title,
      typeId: sess.typeId,
      userMention: String(user),
      userId: user.id,
      answers: sess.answers,
    });
    const eb = new EmbedBuilder()
      .setColor(reviewData.color)
      .setTitle(reviewData.title)
      .setDescription(reviewData.description)
      .setTimestamp();
    if (reviewData.fields.length) eb.addFields(reviewData.fields);

    let m = null;
    if (reviewCh && reviewCh.isTextBased()) {
      const rows = buildAppReviewActionRows({
        appId,
        guildId: reviewCh.guildId,
        ticketChannelId: null,
        includeDecisionButtons: true,
      });
      m = await reviewCh.send({ embeds: [eb], components: rows }).catch(() => null);
    }

    await store.createAppSubmission(appId, {
      id: appId,
      typeId: sess.typeId,
      userId,
      answers: sess.answers,
      status: "PENDING",
      reviewMessageId: m?.id || null,
      reviewChannelId: m ? m.channelId : (reviewCh?.id || reviewId || null),
      createdAt: Date.now()
    });

    // DM confirmation (matches requested screenshot wording)
    await dm.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle("Application submitted.")
          .setDescription("Your application has been submitted.")
      ]
    }).catch(() => {});
    appSessions.delete(userId);
    return;
  }

  const q = qs[sess.qIndex];

  // Normalize common IGN prompt wording
  const qLabelRaw = String(q?.label || '').trim();
  const cleaned = qLabelRaw.replace(/\bminimum\b/ig, '').replace(/\s+/g, ' ').trim();
  const qLabel = /^ign:?$/i.test(cleaned) ? 'What is your IGN?' : cleaned;

  const qEmbed = new EmbedBuilder()
    .setColor(0x08a4a7)
    .setTitle(qLabel.slice(0, 256) || 'Question')
    .setDescription('Reply in this DM with your answer.')
    .setFooter({ text: `Question ${sess.qIndex + 1}/${total}` });

  // Use a single “prompt” message that we edit as the application progresses.
  // This prevents the flow from feeling “stuck” if multiple sends are delayed.
  try {
    if (sess.promptMessageId) {
      const prev = await dm.messages.fetch(sess.promptMessageId).catch(() => null);
      if (prev) {
        await prev.edit({ embeds: [qEmbed], components: [] }).catch(() => {});
      } else {
        const sent = await dm.send({ embeds: [qEmbed] }).catch(() => null);
        if (sent) sess.promptMessageId = sent.id;
      }
    } else {
      const sent = await dm.send({ embeds: [qEmbed] }).catch(() => null);
      if (sent) sess.promptMessageId = sent.id;
    }
  } catch {}

  sess.awaiting = true;
  appSessions.set(userId, sess);
}


// Level Roles Config — IDs come from config.js
const LEVEL_ROLES = C.LEVEL_ROLES;

// Restrict attachments in a specific channel to Rare+ (and staff)
const MEDIA_LOCK_CHANNEL_ID = C.CHANNEL_MEDIA_LOCK;
const MEDIA_MIN_ROLE_LEVEL = 10; // Rare
const MEDIA_ALLOWED_ROLE_IDS = Object.entries(LEVEL_ROLES)
  .filter(([lvl]) => Number(lvl) >= MEDIA_MIN_ROLE_LEVEL)
  .map(([, v]) => v.id);

const INVITE_REGEX = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/.+[a-z]/i;

// Allow invite links ONLY inside these category IDs (everyone)
const INVITE_ALLOWED_CATEGORY_IDS = new Set(C.INVITE_ALLOWED_CATEGORIES.filter(Boolean));

function getCategoryIdFromChannel(channel) {
  if (!channel) return null;
  // For threads, channel.parent is the text channel; its parentId is the category
  if (typeof channel.isThread === 'function' && channel.isThread()) {
    return channel.parent?.parentId || null;
  }
  return channel.parentId || null;
}

// Prestige roles
const PRESTIGE = C.PRESTIGE_ROLES;
const PRESTIGE_MULT = 1.5;

function getPrestigeLevel(member) { return 0; } // prestige removed

// (Removed) Staff/booster XP multiplier role

const DONUTSMP_BASE_URL = process.env.DONUTSMP_BASE_URL || 'https://api.donutsmp.net';
const DONUTSMP_STATS_PATH = process.env.DONUTSMP_STATS_PATH || '/v1/stats/{user}';
const DONUTSMP_BALANCE_PATH = process.env.DONUTSMP_BALANCE_JSON_PATH || 'result.money';
const DONUTSMP_API_KEY = process.env.DONUTSMP_API_KEY;
const PAYWATCH_POLL_MS = 7000;
const PAYWATCH_MAX_MINUTES = 30;

// ── Staff Pay System ──────────────────────────────────────────────────────────
const STAFF_PAY_CHANNEL_ID   = C.CHANNEL_STAFF_PAY;
const STAFF_PAY_ROLE_ID      = C.ROLE_STAFF;
const OWNER_ROLE_ID          = C.ROLE_OWNER;
const CO_OWNER_ROLE_ID       = C.ROLE_CO_OWNER;
const STAFF_PAY_AMOUNT       = C.STAFF_PAY_AMOUNT;
const STAFF_PAY_RECEIVER_IGN = C.STAFF_PAY_RECEIVER_IGN;

const cfg = { token: String(process.env.BOT_TOKEN || process.env.TOKEN || '').trim() };

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));
client.on('error', (err) => console.error('Client error:', err));

function generateId() { return Math.random().toString(36).substring(2, 12); }
function ts(ms) { return `<t:${Math.floor(ms / 1000)}:f>`; }
function tsR(ms) { return `<t:${Math.floor(ms / 1000)}:R>`; }
function money(n) { const v = Number(n); return !Number.isFinite(v) ? '$0' : `$${v.toLocaleString('en-US')}`; }
function seconds(ms) { return Math.max(0, Math.floor(ms / 1000)); }
async function resolveGuildDisplayName(guild, userId) {
  if (!guild || !userId) return 'unknown';
  const member = await guild.members.fetch(userId).catch(() => null);
  if (member?.displayName) return member.displayName;
  const user = await guild.client.users.fetch(userId).catch(() => null);
  return user?.username || 'unknown';
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true }).catch(() => {});
}
async function downloadToFile(url, outPath) {
  await ensureDir(path.dirname(outPath));
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outPath);
    const req = https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(outPath, () => {});
        return resolve(downloadToFile(res.headers.location, outPath));
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(outPath, () => {});
        return reject(new Error(`Download failed: ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(outPath)));
    });
    req.on('error', (err) => {
      file.close();
      fs.unlink(outPath, () => {});
      reject(err);
    });
  });
}


const paywatchTimers = new Map();

const AFK_PREFIX = 'AFK';
const VOUCH_SUFFIX_RE = /\s*\[\d+\]$/;

function extractBaseNameFromDisplay(displayName) {
  let name = String(displayName || '').trim();
  if (!name) return '';

  const LEGACY_PREFIX_RE = /^(?:(?:\[AFK\]|AFK)\s*(?:\|\s*)?)?(?:(?:tier\s*\d+\s+)?(?:support|builder|staff|manager|admin|co[- ]?owner|owner))\s*\|\s*/i;

  // Strip generated pieces repeatedly so names like
  // "[AFK] Staff | Tier 1 Support | Builder | Name [3]" collapse back to "Name".
  let changed = true;
  while (changed && name) {
    changed = false;

    const noVouch = name.replace(VOUCH_SUFFIX_RE, '').trim();
    if (noVouch !== name) {
      name = noVouch;
      changed = true;
    }

    const noBracketAfk = name.replace(/^\[AFK\]\s*/i, '').trim();
    if (noBracketAfk !== name) {
      name = noBracketAfk;
      changed = true;
    }

    const noPipeAfk = name.replace(/^AFK\s*\|\s*/i, '').trim();
    if (noPipeAfk !== name) {
      name = noPipeAfk;
      changed = true;
    }

    const noLegacyPrefix = name.replace(LEGACY_PREFIX_RE, '').trim();
    if (noLegacyPrefix !== name) {
      name = noLegacyPrefix;
      changed = true;
      continue;
    }

    for (const [, prefix] of (C.AUTONICK_ENTRIES || [])) {
      if (prefix && name.startsWith(prefix)) {
        name = name.slice(prefix.length).trim();
        changed = true;
        break;
      }
    }
  }

  return name.trim();
}

async function isAfk(member) {
  if (!member?.guild?.id) return false;
  const a = await store.getAfk(member.guild.id, member.id).catch(() => null);
  return !!a;
}

async function getVouchCountForUser(guildId, userId) {
  const list = await store.getVouches(guildId);
  const row = list.find(v => v.userId === userId);
  return row ? (row.vouchers?.length || 0) : 0;
}

async function syncNickname(member) {
  if (!member || !member.guild || !member.user || member.user.bot) return false;
  const me = member.guild.members.me || await member.guild.members.fetchMe().catch(() => null);
  if (!me?.permissions?.has(PermissionsBitField.Flags.ManageNicknames)) {
    return false; // Silently ignore permission limits
  }
  if (member.id === member.guild.ownerId || me.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
    return false; // Silently ignore members that are too high to be modified
  }

  const afk = await isAfk(member);
  const afkPrefix = afk ? '[AFK] ' : '';

  let rolePrefix = '';
  for (const [roleId, prefix] of (C.AUTONICK_ENTRIES || [])) {
    if (roleId && prefix && member.roles.cache.has(roleId)) {
      rolePrefix = prefix;
      break;
    }
  }
  if (!rolePrefix && member.id === member.guild.ownerId) rolePrefix = 'ᴏᴡɴᴇʀ | ';

  const overrideName = await store.getNickOverride(member.guild.id, member.id).catch(() => null);
  let baseName = overrideName && String(overrideName).trim()
    ? extractBaseNameFromDisplay(String(overrideName).trim())
    : extractBaseNameFromDisplay(member.displayName || member.user.username);
  if (!baseName) baseName = member.user.username;

  const vouchCount = await getVouchCountForUser(member.guild.id, member.id);
  const suffix = vouchCount > 0 ? ` [${vouchCount}]` : '';

  let desired = `${afkPrefix}${rolePrefix}${baseName}${suffix}`.trim();
  if (desired.length > 32) {
    const fixedPrefix = `${afkPrefix}${rolePrefix}`;
    const maxBase = Math.max(0, 32 - fixedPrefix.length - suffix.length);
    desired = `${fixedPrefix}${baseName.slice(0, maxBase)}${suffix}`.trim().slice(0, 32);
  }

  const current = member.nickname || member.user.username;
  if (current === desired) return true;
  await member.setNickname(desired, 'Sync nickname');
  return true;
}

// Returns the payout rate (fraction kept by builder) based on their builder tier.
async function getBuilderTaxRate(guild, builderDiscordId) {
  try {
    const member = await guild.members.fetch(builderDiscordId).catch(() => null);
    if (!member) return 0.90;
    const roleConfig = {
      ...C,
      ROLE_BUILDER_TIER_1: await store.getConfigValue(guild.id, 'ROLE_BUILDER_TIER_1').catch(() => null)
        || await store.getConfigValue(guild.id, 'ROLE_TRAINEE_BUILDER').catch(() => null)
        || C.ROLE_BUILDER_TIER_1
        || C.ROLE_BUILDER_3,
      ROLE_BUILDER_TIER_2: await store.getConfigValue(guild.id, 'ROLE_BUILDER_TIER_2').catch(() => null)
        || await store.getConfigValue(guild.id, 'ROLE_TRAINED_BUILDER').catch(() => null)
        || C.ROLE_BUILDER_TIER_2
        || C.ROLE_BUILDER_2,
      ROLE_BUILDER_TIER_3: await store.getConfigValue(guild.id, 'ROLE_BUILDER_TIER_3').catch(() => null)
        || await store.getConfigValue(guild.id, 'ROLE_CHIEF_BUILDER').catch(() => null)
        || C.ROLE_BUILDER_TIER_3
        || C.ROLE_BUILDER_1,
    };
    const roleIds = [...member.roles.cache.keys()];
    return getBuilderPayoutRateForRoleIds(roleIds, roleConfig);
  } catch { return 0.90; }
}

// Build a consistent tracking embed for any build job status
function buildTrackingEmbed(job, status, opts = {}) {
  const payoutRate = Number.isFinite(Number(job.taxRate)) ? Number(job.taxRate) : 0.90;
  const payoutPct = formatPayoutRate(payoutRate);
  const builderPayout = Math.floor(job.price * payoutRate);
  let color, title;
  switch (status) {
    case 'PENDING': color = 0xFFC300; title = 'Build In Progress'; break;
    case 'AWAITING_CONFIRM': color = 0xFF8C00; title = 'Awaiting Customer Confirmation'; break;
    case 'AWAITING_PAYOUT': color = 0x57f287; title = 'Customer Confirmed — Ready for Payout'; break;
    case 'COMPLETE': color = 0xFFFFFF; title = 'Build Complete'; break;
    case 'CANCELLED': color = 0xed4245; title = 'Build Cancelled'; break;
    default: color = 0xFFC300; title = 'Build In Progress';
  }
  if (opts.title) title = opts.title;

  const fields = [
    { name: `${E_FARM} Build`, value: job.buildType ? job.buildType.replace(/\b\w/g, c => c.toUpperCase()) : '—', inline: true },
    { name: `${E_MEMBER} Customer Discord`, value: job.customerDiscordId ? `<@${job.customerDiscordId}>` : '—', inline: true },
    { name: `${E_SENDER} Customer IGN`, value: job.customerIgn ? `\`${job.customerIgn}\`` : '—', inline: true },
    { name: `${E_RECEIVER} Builder IGN`, value: job.builderIgn ? `\`${job.builderIgn}\`` : '—', inline: true },
    { name: `${E_PRICE} Price`, value: money(job.price), inline: true },
    { name: `${E_RECEIVER} Receiver`, value: job.receiverDiscordId ? `<@${job.receiverDiscordId}> (\`${job.receiverIgn}\`)` : (job.receiverIgn ? `\`${job.receiverIgn}\`` : '—'), inline: true },
  ];

  if (status === 'AWAITING_PAYOUT' || status === 'COMPLETE') {
    fields.push({ name: `${E_PRICE} Builder Payout`, value: `${money(builderPayout)} (${payoutPct})`, inline: true });
  }
  if (status === 'AWAITING_PAYOUT') {
    fields.push({ name: `${E_STATUS} Status`, value: job.receiverDiscordId ? `Awaiting payment from <@${job.receiverDiscordId}>` : `Awaiting payment to \`${job.receiverIgn}\``, inline: false });
  }
  if (status === 'PENDING' && opts.customerPaidAt) {
    fields.push({ name: `${E_VERIFY} Customer Paid`, value: ts(opts.customerPaidAt), inline: true });
    fields.push({ name: `${E_STATUS} Status`, value: 'Building in progress', inline: true });
  }
  if (status === 'COMPLETE' && opts.finalizedAt) {
    fields.push({ name: `${E_VERIFY} Completed`, value: ts(opts.finalizedAt), inline: true });
    fields.push({ name: `${E_STATUS} Status`, value: 'Complete', inline: true });
  }
  if (status === 'AWAITING_CONFIRM') {
    fields.push({ name: `${E_STATUS} Status`, value: 'Waiting for customer confirmation', inline: true });
  }
  if (status === 'CANCELLED' && opts.cancelledBy) {
    fields.push({ name: `${E_INFO} Cancelled by`, value: `<@${opts.cancelledBy}>`, inline: true });
  }
  if (opts.dispute) {
    fields.push({ name: `${E_STATUS} Status`, value: 'Disputed — customer did not confirm receipt', inline: false });
  }

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .addFields(...fields)
    .setFooter({ text: `Build ID: ${job.id}` })
    .setTimestamp(opts.timestamp || Date.now());
}

async function syncLevelRoles(member, currentLevel) {
  const eligibleLevels = Object.keys(LEVEL_ROLES).map(Number).filter(l => l <= currentLevel);
  const highestLevel = eligibleLevels.length > 0 ? Math.max(...eligibleLevels) : 0;

  for (const [lvlStr, config] of Object.entries(LEVEL_ROLES)) {
    const lvl = parseInt(lvlStr);
    const role = member.guild.roles.cache.get(config.id);
    if (!role) continue;

    if (lvl === highestLevel) {
      if (!member.roles.cache.has(config.id)) {
        await member.roles.add(role).catch(e => {
          if (!e.message?.includes('Connect Timeout')) console.error(`Failed to add role ${role?.name}:`, e.message);
        });
      }
    } else {
      if (member.roles.cache.has(config.id)) {
        await member.roles.remove(role).catch(e => console.error(`Failed to remove role ${role.name}:`, e.message));
      }
    }
  }
}

async function handleLevelUp(member, newLevel, oldLevel, currentXp) {
  if (!member || member.user?.bot) return;
  const normalizedNew = Math.max(0, Number(newLevel) || 0);
  const normalizedOld = Math.max(0, Number(oldLevel) || 0);
  await syncLevelRoles(member, normalizedNew).catch(() => {});

  try {
    const channel = LEVEL_UP_CHANNEL_ID
      ? await client.channels.fetch(LEVEL_UP_CHANNEL_ID).catch(() => null)
      : null;
    if (!channel || typeof channel.send !== 'function') return;

    const freshMember = member.guild?.members?.cache?.get(member.id)
      || await member.guild?.members?.fetch(member.id).catch(() => member)
      || member;

    for (let lvl = normalizedOld + 1; lvl <= normalizedNew; lvl++) {
      const totalXp = getXpForLevel(lvl);
      const nextXp = getXpForLevel(lvl + 1);
      const currentRoleCfg = Object.entries(C.LEVEL_ROLES || {})
        .map(([level, cfg]) => ({ level: Number(level), id: cfg?.id }))
        .filter(x => Number.isFinite(x.level) && x.level <= lvl)
        .sort((a, b) => b.level - a.level)[0] || null;
      const roleName = currentRoleCfg?.id
        ? (member.guild.roles.cache.get(currentRoleCfg.id)?.name || null)
        : null;

      const eb = new EmbedBuilder()
        .setColor(0x08a4a7)
        .setAuthor({ name: `${freshMember.displayName || freshMember.user?.username || 'Member'} leveled up`, iconURL: freshMember.displayAvatarURL?.({ extension: 'png', size: 256 }) || undefined })
        .setDescription(`${freshMember} reached **Level ${lvl}**.`)
        .addFields(
          { name: 'Total XP', value: `**${Number(totalXp || currentXp || 0).toLocaleString('en-US')}**`, inline: true },
          { name: 'Next Level', value: `**${Math.max(0, nextXp - totalXp).toLocaleString('en-US')} XP**`, inline: true },
          { name: 'Tier', value: roleName ? `**${roleName}**` : '—', inline: true },
        )
        .setTimestamp();
      await channel.send({ embeds: [eb] }).catch(() => {});
    }
  } catch (err) {
    console.error('Error sending level-up message:', err);
  }
}

const ACTIVE_BUILD_STATUSES = ['PENDING', 'WAITING_PAYMENT', 'AWAITING_CONFIRM', 'AWAITING_PAYOUT'];
function getActiveBuildJobsForGuild(guildId, jobs) {
  return (jobs || []).filter(j => (!j?.guildId || j.guildId === guildId) && ACTIVE_BUILD_STATUSES.includes(String(j.status || '').toUpperCase()));
}
function buildRemoveSelectOption(job) {
  const labelBase = `${job.buildType || 'Build'} • ${job.customerIgn || 'Unknown'}`.slice(0, 100);
  const status = String(job.status || 'PENDING').replaceAll('_', ' ');
  const description = `${job.builderIgn || 'No builder'} • ${money(job.price || 0)} • ${status}`.slice(0, 100);
  return {
    label: labelBase,
    value: job.id,
    description,
  };
}

const statsPanelSessions = new Map();
const buildRemoveSessions = new Map();

function chunkItems(items, size = 10) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out.length ? out : [[]];
}

function statsNavRow(kind, sessionId, page, totalPages) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`stats_nav:${kind}:${sessionId}:prev`).setLabel('Prev').setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
    new ButtonBuilder().setCustomId(`stats_nav:${kind}:${sessionId}:next`).setLabel('Next').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages - 1),
  )];
}

function renderStaffStatsEmbed(rows, page, totalPages) {
  const pageRows = chunkItems(rows, 10)[page] || [];
  const fmtMs = (ms) => { if (ms == null) return '—'; const sec = Math.max(0, Math.round(ms / 1000)); const m = Math.floor(sec / 60); const s = sec % 60; return `${m}m ${String(s).padStart(2,'0')}s`; };
  const desc = pageRows.length ? pageRows.map((r, i) => {
    const n = page * 10 + i + 1;
    return `**${n}.** <@${r.staffId}>\n> **Closed:** \`${r.closed}\` | **Renamed:** \`${r.renamed}\`\n> **Messages:** \`${r.messages}\` | **Avg Response:** \`${fmtMs(r.avgMs)}\``;
  }).join('\n\n') : 'No stats yet.';
  return new EmbedBuilder()
    .setColor(0x00A8FF)
    .setTitle('Staff Performance Leaderboard')
    .setDescription(desc)
    .setFooter({ text: `Page ${page + 1}/${totalPages} • Staff Stats` })
    .setTimestamp();
}

function renderBuilderStatsEmbed(rows, page, totalPages) {
  const pageRows = chunkItems(rows, 10)[page] || [];
  const desc = pageRows.length ? pageRows.map((r, i) => {
    const n = page * 10 + i + 1;
    return buildBuilderLeaderboardLine(r, n, money);
  }).join('\n\n') : 'No builder stats yet.';
  return new EmbedBuilder()
    .setColor(0xFFB300)
    .setTitle('Builder Leaderboard')
    .setDescription(desc)
    .setFooter({ text: `Page ${page + 1}/${totalPages} • Top Builders` })
    .setTimestamp();
}

function buildRemoveConfirmRow(sessionId, buildId) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`build_remove_confirm:${sessionId}:${buildId}`).setLabel('Confirm Remove').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`build_remove_cancel:${sessionId}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary),
  )];
}

// --- Interaction response helpers (avoid double-acknowledgement) ---
async function safeReply(interaction, payload) {
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply(payload);
}

async function safeComponentReply(interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) return await interaction.followUp(payload);
    return await interaction.reply(payload);
  } catch (err) {
    if (err?.code === 10062) return null;
    throw err;
  }
}

// --- Edit sessions: cache content so select->modal stays under Discord's 3s window ---
const embedEditSessions = new Map();
const stickyEditSessions = new Map();

function createSessionId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}


async function promptStickyEditDropdown(interaction) {
  const stickies = await store.getStickies(interaction.channelId);
  if (!stickies || stickies.length === 0) {
    await safeReply(interaction, { content: '❌ No sticky messages exist in this channel.', flags: 64 });
    return;
  }

  // If only one sticky, open modal directly
  if (stickies.length === 1) {
    const sticky = stickies[0];
    const modal = new ModalBuilder()
      .setCustomId(`sticky_edit_modal:${sticky.id}`)
      .setTitle('Edit Sticky Message');

    const contentInput = new TextInputBuilder()
      .setCustomId('sticky_content')
      .setLabel('Message Text (Optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setValue(sticky.content || '');

    const titleInput = new TextInputBuilder()
      .setCustomId('sticky_embed_title')
      .setLabel('Embed Title (Optional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(sticky.embed?.title || '');

    const descInput = new TextInputBuilder()
      .setCustomId('sticky_embed_desc')
      .setLabel('Embed Description (Optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setValue(sticky.embed?.description || '');

    const colorInput = new TextInputBuilder()
      .setCustomId('sticky_embed_color')
      .setLabel('Embed Color (Hex)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(sticky.embed?.color || '#2b2d31');

    modal.addComponents(
      new ActionRowBuilder().addComponents(contentInput),
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descInput),
      new ActionRowBuilder().addComponents(colorInput)
    );

    await interaction.showModal(modal);
    return;
  }

  // Dropdown for multiple stickies
  const sessionId = createSessionId();
  const entries = new Map();
  for (const s of stickies.slice(0, 25)) entries.set(s.id, s);
  stickyEditSessions.set(sessionId, { userId: interaction.user.id, channelId: interaction.channelId, entries });

  const options = stickies.slice(0, 25).map((s, i) => ({
    label: (s.embed?.title || s.content || `Sticky ${i + 1}`).slice(0, 100),
    value: s.id
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId(`sticky_edit_select:${sessionId}`)
    .setPlaceholder('Select a sticky to edit')
    .addOptions(options);

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: 64 }).catch(() => {});
  }
  await safeReply(interaction, {
    content: 'Select the sticky you want to edit:',
    components: [new ActionRowBuilder().addComponents(select)],
    flags: 64
  });
}

async function promptEmbedEditDropdown(interaction) {
  // Always acknowledge immediately so we never double-reply and never hit the 3s window.
  // We'll edit the deferred reply with the dropdown once we finish scanning messages.
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: 64 }).catch(() => {});
  }
  // Fetch recent messages and find ones with embeds
  const msgs = await interaction.channel.messages.fetch({ limit: 50 }).catch(() => null);
  if (!msgs) {
    await safeReply(interaction, { content: '❌ Could not read messages in this channel.', flags: 64 });
    return;
  }

  const candidates = [];
  for (const m of msgs.values()) {
    if (!m) continue;
    if (!m.embeds || m.embeds.length === 0) continue;
    // Prefer bot-authored messages for safety
    if (m.author?.id !== client.user.id) continue;
    const e = m.embeds[0];
    const labelBase = (e?.title || m.content || 'Embed message').toString().trim();
    const label = labelBase.length ? labelBase.slice(0, 90) : 'Embed message';
    candidates.push({ id: m.id, label, ts: m.createdTimestamp || 0 });
  }

  candidates.sort((a, b) => b.ts - a.ts);
  const top = candidates.slice(0, 25);
  if (top.length === 0) {
    await safeReply(interaction, { content: '❌ No recent bot embed messages found in this channel.', flags: 64 });
    return;
  }

  // Cache snapshots so select->modal can be immediate (no API fetch => no Unknown interaction)
  const sessionId = createSessionId();
  const entries = new Map();
  for (const c of top) {
    const m = msgs.get(c.id);
    const e = m?.embeds?.[0];
    entries.set(c.id, {
      messageId: c.id,
      content: m?.content || '',
      title: e?.title || '',
      description: e?.description || '',
      color: e?.hexColor || '#2b2d31'
    });
  }
  embedEditSessions.set(sessionId, { userId: interaction.user.id, channelId: interaction.channelId, entries });

  // Dropdown shows ONLY titles
  const options = top.map((c) => {
    const snap = entries.get(c.id);
    const t = (snap?.title || '(no title)').toString().trim();
    return { label: (t || '(no title)').slice(0, 100), value: c.id };
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId(`embed_edit_select:${sessionId}`)
    .setPlaceholder('Select an embed message to edit')
    .addOptions(options);

  await safeReply(interaction, {
    content: 'Select the embed message you want to edit:',
    components: [new ActionRowBuilder().addComponents(select)],
    flags: 64
  });
}

async function logModAction(guild, action, user, reason, contextLink = '', color = Colors.Red) {
  try {
    const channel = await safeFetchChannel(guild, MOD_LOG_CHANNEL_ID);
    if (!channel) return;
    let desc = `**${action}** | User: <@${user.id}> | Reason: ${reason}`;
    if (contextLink) desc += ` | [Jump](${contextLink})`;
    const prefix = color === Colors.Green ? '✅' : '🛑';
    const embed = new EmbedBuilder().setDescription(`${prefix} ${desc}`).setColor(color).setTimestamp();
    await channel.send({ embeds: [embed] });
  } catch (err) { console.error('Failed to send mod log:', err); }
}

async function logVouch(guild, { vouchedMember, voucherMember, reason }) {
  try {
    const channel = await safeFetchChannel(guild, MOD_LOG_CHANNEL_ID);
    if (!channel) return;
    const eb = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle('<:success:1483973364396589177> Vouch Added')
      .setDescription(`${voucherMember} vouched ${vouchedMember}.`)
      .setTimestamp();
    if (reason) {
      const cleanReason = String(reason || '').replace(/```/g, '\`\`\`').slice(0, 900) || '(no message)';
      eb.addFields({ name: 'Message', value: `\`\`\`${cleanReason}\`\`\`` });
    }
    await channel.send({ embeds: [eb] });
  } catch (err) { console.error('Failed to send vouch log:', err); }
}


async function sendTicketQueueDm(userId, embed) {
  try {
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return;
    await user.send({ embeds: [embed] }).catch(() => {});
  } catch {}
}

async function processExpiredTimedRoles() {
  try {
    const expired = await store.listExpiredTimedRoles(Date.now()).catch(() => []);
    for (const rec of expired) {
      const guild = client.guilds.cache.get(rec.guildId) || await client.guilds.fetch(rec.guildId).catch(() => null);
      if (!guild) continue;
      const member = await guild.members.fetch(rec.userId).catch(() => null);
      if (member?.roles?.cache?.has(rec.roleId)) {
        await member.roles.remove(rec.roleId, 'Timed role expired').catch(() => {});
      }
      await store.revokeTimedRole(rec.guildId, rec.userId, rec.roleId, client.user?.id || null).catch(() => {});
      const role = guild.roles.cache.get(rec.roleId);
      await sendTicketQueueDm(rec.userId, buildTicketDmEmbed({ title: 'Role Expired', description: `Your timed role ${role ? role.toString() : `\`${rec.roleId}\``} has expired.` }));
    }
  } catch (err) { console.error('Timed role expiry error:', err); }
}

client.once('clientReady', async () => {
  await store.init();
  console.log(`Logged in as ${client.user.tag}`);
  setInterval(checkGiveaways, 30 * 1000);
  // Seed static autonick defaults into store so /autonick list shows them
  for (const guild of client.guilds.cache.values()) {
    await store.seedAutoNickDefaults(guild.id, STATIC_AUTONICK_ENTRIES).catch(() => {});
    await ensureSchematicGuidelinesPost(guild).catch(() => {});
  }

  checkGiveaways().catch(() => {}); // run immediately on startup to catch missed endings

  // Hardcoded panel/application cleanup
  try {
    const panel = await store.getTicketPanel('ticket_center').catch(() => null);
    if (panel?.components) {
      const beforeEmbed = JSON.stringify(panel.embed || {});
      const before = JSON.stringify(panel.components);

      // Canonical embed copy — title, description, color.
      panel.embed = panel.embed || {};
      panel.embed.title = 'Ticket Center';
      panel.embed.description = [
        'Choose the service you need and a staff member will assist you shortly.',
        '',
        '- Open only **ONE** of each ticket at a time',
        '- Be respectful, detailed, and patient',
        '- Abuse = blacklist from future services',
      ].join('\n');
      panel.embed.color = 0x08a4a7;

      // Reset components to the canonical layout. Existing button configs
      // (categoryId, welcome, etc.) are preserved by reusing prior values.
      const flatExisting = panel.components.flat();
      const findExisting = (key) => flatExisting.find(c => c?.type === 'button' && c?.key === key) || null;

      const supportLikeButton = (key, label, emoji, fallbackCategoryId, fallbackWelcome, qLabel = 'Describe your issue') => {
        const existing = findExisting(key);
        return {
          type: 'button',
          key,
          label,
          emoji,
          styleName: 'Secondary',
          categoryId: existing?.categoryId || fallbackCategoryId,
          questions: [
            { id: 'issue', label: qLabel, style: 'Paragraph', required: true, min: 10, max: 1024 }
          ],
          welcome: existing?.welcome || fallbackWelcome,
        };
      };

      const otherBtn = supportLikeButton(
        'support', 'Other', '⚠️',
        C.TICKET_CATEGORIES.SUPPORT,
        'Welcome {userMention}, thank you for reaching out!\nPlease describe your issue and we will get back to you as soon as possible.',
      );
      const farmHelpBtn = supportLikeButton(
        'farm_help', 'Farm Help', '🌱',
        C.TICKET_CATEGORIES.FARM_HELP,
        'Welcome {userMention}! Describe what farm/build help you need and a helper will be with you shortly.',
        'What do you need help with?'
      );
      const publishSchematicBtn = supportLikeButton(
        'publish_schematic', 'Publish Schematic', '📦',
        C.TICKET_CATEGORIES.PUBLISH_SCHEMATIC,
        'Welcome {userMention}! Share your schematic details and a reviewer will be with you shortly.',
        'Describe the schematic you want to publish'
      );
      const scamReportBtn = supportLikeButton(
        'scam_report', 'Scam Report', '🔴',
        C.TICKET_CATEGORIES.SCAM_REPORT,
        'Welcome {userMention}! Describe the scam and include any evidence — staff will assist you shortly.',
        'Describe the scam and include evidence'
      );

      // Carry forward giveaway_claim + partnerships exactly as they were
      // (only refresh giveaway_claim questions to canonical shape).
      const gwExisting = findExisting('giveaway_claim');
      const giveawayBtn = gwExisting ? {
        ...gwExisting,
        type: 'button',
        questions: [
          { id: 'ign', label: 'IGN', style: 'Short', required: true, min: 1, max: 40 },
          { id: 'proof', label: 'Will you send proof?', style: 'Short', required: true, min: 1, max: 100 }
        ],
      } : null;
      const partnershipsBtn = findExisting('partnerships');

      // Final canonical layout: 5-then-up-to-2 across two rows.
      const row1 = [otherBtn, farmHelpBtn, publishSchematicBtn, scamReportBtn];
      if (giveawayBtn) row1.push(giveawayBtn);
      const row2 = [];
      if (partnershipsBtn) row2.push(partnershipsBtn);
      panel.components = row2.length ? [row1, row2] : [row1];

      const after = JSON.stringify(panel.components);
      const afterEmbed = JSON.stringify(panel.embed);
      if (before !== after || beforeEmbed !== afterEmbed) {
        await store.setTicketPanel('ticket_center', panel).catch(() => {});
      }
    }

    // Applications panel — title/description/color migration. Components are
    // left alone; /application close/open handles those.
    const appPanel = await store.getTicketPanel('applications').catch(() => null);
    if (appPanel) {
      const beforeAppEmbed = JSON.stringify(appPanel.embed || {});
      appPanel.embed = appPanel.embed || {};
      appPanel.embed.title = 'Applications';
      appPanel.embed.description = [
        '> **Staff Applicants**:',
        '• Enforce rules fairly and consistently',
        '• Prioritize community culture over authority',
        '• Act professionally in all situations',
        '',
        '> **Builder Applicants**:',
        '• Understand DonutSMP mechanics',
        '• Can use schematics',
        '• Build farms in a timely manner',
        '',
        '> **Before Applying**',
        'Ensure that:',
        '• You meet activity expectations',
        '• You can commit time daily',
        '',
        '-# Low-effort or troll applications will be denied automatically.',
      ].join('\n');
      appPanel.embed.color = 0x08a4a7;
      const afterAppEmbed = JSON.stringify(appPanel.embed);
      if (beforeAppEmbed !== afterAppEmbed) {
        await store.setTicketPanel('applications', appPanel).catch(() => {});
      }
    }

    const staffType = await store.getAppType('staff').catch(() => null);
    if (staffType?.questions) {
      staffType.questions = sanitizeStaffApplicationQuestions(staffType.questions);
      staffType.title = staffType.title || 'Support Staff Application';
      await store.setAppType('staff', staffType).catch(() => {});
    }
  } catch (e) { console.error('startup panel migration error:', e?.message); }
  const watching = await store.listWatching();
  for (const w of watching) startPaywatchPolling(w.id);

  try {
    if (buildQueue && typeof buildQueue.refreshQueueBoard === 'function') {
      for (const guild of client.guilds.cache.values()) {
        await buildQueue.refreshQueueBoard(guild, store).catch(() => {});
      }
    }
  } catch (e) { console.error('build queue board restore error:', e); }

  try {
    for (const guild of client.guilds.cache.values()) {
      await sendAcceptedInfoBackfillForGuild(guild).catch(() => {});
    }
  } catch (e) { console.error('accepted staff info backfill error:', e?.message || e); }

  await processExpiredTimedRoles().catch(() => {});
  setInterval(() => processExpiredTimedRoles().catch(() => {}), 60 * 1000);

  // Fix permissions on all existing ticket channels to match per-category allowlists
  try {
    const cfg = await store.getTicketConfig().catch(() => null);
    for (const guild of client.guilds.cache.values()) {
      for (const [catId, allowedRoles] of Object.entries(CATEGORY_EXTRA_VIEWER_ROLES)) {
        const cachedAllowedRoles = filterCachedRoleIds(allowedRoles, guild.roles);
        const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText && c.parentId === catId);
        for (const ch of channels.values()) {
          try {
            // Get the current permission overwrites
            const existing = ch.permissionOverwrites.cache;
            // Collect role IDs that currently have ViewChannel access
            const rolesWithAccess = [...existing.values()]
              .filter(ow => ow.type === 1) // 1 = role overwrite
              .map(ow => ow.id);
            // Remove roles that should NOT have access in this category
            const configuredStaffId = await store.getConfigValue(guild.id, 'ROLE_STAFF').catch(() => null);
            const globalStaffIds = filterCachedRoleIds([...(cfg?.staffRoleIds || []), configuredStaffId, C.ROLE_STAFF], guild.roles);
            for (const rid of rolesWithAccess) {
              if (rid === guild.roles.everyone.id) continue; // keep @everyone deny
              const isAllowed = cachedAllowedRoles.includes(rid);
              // If a global staff role is in here but not in allowedRoles, remove it
              if (!isAllowed && globalStaffIds.includes(rid)) {
                await ch.permissionOverwrites.delete(rid).catch(() => {});
              }
            }
            // Add any missing allowed roles. The schematic-helper role gets
            // a reduced perm set (no ManageMessages); all other roles keep the
            // legacy staff allow-list.
            for (const rid of cachedAllowedRoles) {
              if (!rolesWithAccess.includes(rid)) {
                const isSchematicHelper = rid === SCHEMATIC_HELPER_ROLE_ID;
                const perms = isSchematicHelper
                  ? { ViewChannel: true, SendMessages: true, ReadMessageHistory: true, AttachFiles: true }
                  : { ViewChannel: true, SendMessages: true, ReadMessageHistory: true, ManageMessages: true };
                await ch.permissionOverwrites.create(rid, perms).catch(() => {});
              }
            }
            if (catId === C.TICKET_CATEGORIES.SPAWNER_BUY || catId === C.TICKET_CATEGORIES.SPAWNER_SELL) {
              for (const rid of globalStaffIds) {
                if (!cachedAllowedRoles.includes(rid)) {
                  await ch.permissionOverwrites.edit(rid, { ViewChannel: false }).catch(() => {});
                }
              }
            }
          } catch {}
        }
      }
    }
    console.log('[Startup] Ticket permission sync complete.');
  } catch (e) { console.error('Startup permission sync error:', e?.message); }
  // (fixes names for tickets that existed before this naming logic was added)
  try {
    for (const guild of client.guilds.cache.values()) {
      const buildingCat = guild.channels.cache.get(BUILDING_TICKET_CATEGORY_ID);
      if (!buildingCat) continue;
      const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText && c.parentId === BUILDING_TICKET_CATEGORY_ID);
      for (const ch of textChannels.values()) {
        const rec = await store.getTicketRecord(ch.id).catch(() => null);
        if (!rec) continue;
        // Populate claimerUsername from the claimed member if missing
        if (rec.claimedById && !rec.claimerUsername) {
          try {
            const m = await guild.members.fetch(rec.claimedById).catch(() => null);
            if (m) {
              await store.updateTicketRecord(ch.id, { claimerUsername: m.user.username }).catch(() => {});
              rec.claimerUsername = m.user.username;
            }
          } catch {}
        }
        // Apply name directly at startup (bypass rate-limit queue for initial sync)
        const desiredName = buildingTicketDesiredName(rec).slice(0, 100);
        if (ch.name !== desiredName) {
          await ch.setName(desiredName).catch(() => {});
        }
      }
    }
  } catch (e) { console.error('Startup ticket name sync error:', e?.message); }

  // Restore Pay buttons on any AWAITING_PAYOUT build jobs whose embeds lost their button
  try {
    const awaitingJobs = await store.listBuildJobs('AWAITING_PAYOUT').catch(() => []);
    for (const job of awaitingJobs) {
      try {
        if (!job.buildChannelId || !job.buildMessageId) continue;
        const buildCh = await client.channels.fetch(job.buildChannelId).catch(() => null);
        if (!buildCh) continue;
        const buildMsg = await buildCh.messages.fetch(job.buildMessageId).catch(() => null);
        if (!buildMsg) continue;
        // Check if it already has a button — if no components, restore them
        if (!buildMsg.components?.length) {
          const payBtn = new ButtonBuilder().setCustomId(`build_admin_pay:${job.id}`).setLabel('Pay Builder').setStyle(ButtonStyle.Success);
          const row = new ActionRowBuilder().addComponents(payBtn);
          const restoredEmbed = buildTrackingEmbed(job, 'AWAITING_PAYOUT');
          await buildMsg.edit({ embeds: [restoredEmbed], components: [row] }).catch(() => {});
        }
      } catch {}
    }
    if (awaitingJobs.length) console.log(`[Startup] Restored Pay buttons on ${awaitingJobs.length} build job(s).`);
  } catch (e) { console.error('Startup pay-button restore error:', e?.message); }

  // Best-effort sync: apply vouch-count + role prefix to all members on startup.
  for (const guild of client.guilds.cache.values()) {
    await guild.members.fetch().catch(() => null);
    for (const m of guild.members.cache.values()) {
      if (m.user.bot) continue;
      await syncNickname(m).catch(() => {});
    }
  }
});

// --- WELCOME MESSAGE (modern / aesthetic) ---
client.on('guildMemberAdd', async (member) => {
  try {
    if (!member || member.user?.bot) return;

    // Simple one-line welcome message — channel from DB or config.js
    const welcomeChannelId = await store.getConfigValue(member.guild.id, 'CHANNEL_WELCOME').catch(() => null)
      || (C.CHANNEL_WELCOME && C.CHANNEL_WELCOME.length > 5 ? C.CHANNEL_WELCOME : null);
    if (!welcomeChannelId) return;
    const ch = await member.guild.channels.fetch(welcomeChannelId).catch(() => null);
    if (!ch || typeof ch.isTextBased !== 'function' || !ch.isTextBased()) return;

    const memberNum = member.guild?.memberCount ?? 0;
    await ch.send(`Welcome ${member} to **EtZ Empire** — you’re member #${memberNum}.`).catch(() => {});
    // If the member is vouchable, apply their vouch-count nickname tag on join.
    await syncNickname(member);
  } catch (e) {
    console.error('welcome message error:', e);
  }
});

function isVouchable(member) { return !!member && !member.user?.bot; }

// Tracks for staff-change alerts. Each track is an ordered ladder (low→high);
// a promotion or demotion within ONE track triggers an embed. The Member role
// is the entry-level "sentinel" for the builder track — used only to label
// the "before" side of a fresh promotion, never as a destination by itself.
const STAFF_TRACK_MEMBER_SENTINEL = '1483225250698105069'; // Member role
const STAFF_TRACKS = {
  builder: [
    STAFF_TRACK_MEMBER_SENTINEL, // Member (sentinel, index 0)
    '1483584432735785101',       // Tier 1 Builder (BUILDER_1 / Trainee)
    '1483225250824196266',       // Tier 2 Builder (BUILDER_2)
    '1483225250824196265',       // Tier 3 Builder (BUILDER_3 / Head)
  ],
  staff: [
    '1483584515942252695', // Support (Trial Mod)
    '1483584512859439276', // Moderator
    '1483584518408638574', // Supervisor (Chief Mod)
    '1483225250861940742', // Manager
    '1483225250861940743', // Administrator
    '1483225250861940744', // Co-Owner
    '1483225250966671463', // Owner
  ],
};

function highestRoleInTrack(member, trackIds) {
  if (!member?.roles?.cache) return null;
  // walk from highest rank to lowest, return first match
  for (let i = trackIds.length - 1; i >= 0; i--) {
    if (member.roles.cache.has(trackIds[i])) return trackIds[i];
  }
  return null;
}

async function postStaffChangeAlert(guild, member, oldRoleId, newRoleId) {
  try {
    const channel = await guild.channels.fetch(STAFF_CHANGE_LOG_CHANNEL_ID).catch(() => null);
    if (!channel?.isTextBased?.()) return;
    const oldRole = oldRoleId ? guild.roles.cache.get(oldRoleId) : null;
    const newRole = newRoleId ? guild.roles.cache.get(newRoleId) : null;
    const oldName = oldRole?.name || (oldRoleId ? `\`${oldRoleId}\`` : '—');
    const newName = newRole?.name || (newRoleId ? `\`${newRoleId}\`` : '—');
    const eb = new EmbedBuilder()
      .setColor(0x08a4a7)
      .setAuthor({ name: member.user.tag || member.user.username, iconURL: member.displayAvatarURL?.({ extension: 'png', size: 128 }) || undefined })
      .setDescription(`${member} **${oldName} → ${newName}**`)
      .setTimestamp();
    await channel.send({ embeds: [eb] }).catch(() => {});
  } catch (e) {
    console.error('[staff-change] post error:', e?.message);
  }
}

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  try {
    const was = isVouchable(oldMember);
    const now = isVouchable(newMember);
    const hadTag = VOUCH_TAG_RE.test(oldMember?.nickname || '');
    // Sync nickname on any role change or vouch tag change
    const rolesChanged = oldMember.roles.cache.size !== newMember.roles.cache.size ||
      [...oldMember.roles.cache.keys()].some(id => !newMember.roles.cache.has(id)) ||
      [...newMember.roles.cache.keys()].some(id => !oldMember.roles.cache.has(id));
    if (was !== now || hadTag || rolesChanged) {
      await syncNickname(newMember);
    }

    // Staff role-change alert. We classify each track's change first, then
    // only fire if EXACTLY ONE track changed in any way (added/removed/shifted)
    // AND that change has both an "old" and "new" role we can name. This
    // suppresses cross-category swaps like Support → Builder, where two tracks
    // change at once (Support removed in staff track, Tier 1 added in builder).
    if (rolesChanged && newMember.guild) {
      const changes = [];
      for (const [_name, trackIds] of Object.entries(STAFF_TRACKS)) {
        const oldHigh = highestRoleInTrack(oldMember, trackIds);
        const newHigh = highestRoleInTrack(newMember, trackIds);
        if (oldHigh !== newHigh) changes.push({ oldHigh, newHigh });
      }
      if (changes.length === 1) {
        const { oldHigh, newHigh } = changes[0];
        if (oldHigh && newHigh) {
          await postStaffChangeAlert(newMember.guild, newMember, oldHigh, newHigh);
        }
      }
    }
  } catch {}
});

async function buildWelcomeCard(member) {
  // Banner-style welcome card (similar to reference): wide, centered avatar, minimal text.
  const W = 900;
  const H = 280;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background: dark gradient + soft bokeh to mimic a modern banner.
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0b1020');
  grad.addColorStop(0.55, '#11102a');
  grad.addColorStop(1, '#0a2032');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Soft bokeh circles (no external images)
  for (const c of [
    { x: 120, y: 70, r: 90, a: 0.22 },
    { x: 260, y: 210, r: 130, a: 0.18 },
    { x: 740, y: 85, r: 120, a: 0.16 },
    { x: 820, y: 215, r: 160, a: 0.14 },
  ]) {
    ctx.globalAlpha = c.a;
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    g.addColorStop(0, 'rgba(111,183,255,0.9)');
    g.addColorStop(1, 'rgba(111,183,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Dark overlay band across center (reference-like)
  ctx.fillStyle = 'rgba(0,0,0,0.46)';
  roundRect(ctx, 60, 78, W - 120, 150, 22);
  ctx.fill();

  // Thin top highlight
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#6FB7FF';
  roundRect(ctx, 60, 78, W - 120, 3, 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Avatar circle (centered)
  const avatarSize = 110;
  const ax = Math.floor(W / 2 - avatarSize / 2);
  const ay = 36;
  const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatarImg = await loadImage(await fetchToBuffer(avatarUrl));

  ctx.save();
  ctx.beginPath();
  ctx.arc(ax + avatarSize / 2, ay + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarImg, ax, ay, avatarSize, avatarSize);
  ctx.restore();

  // Avatar ring
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#EAF4FF';
  ctx.beginPath();
  ctx.arc(ax + avatarSize / 2, ay + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
  ctx.stroke();

  // Outer glow ring
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = '#6FB7FF';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(ax + avatarSize / 2, ay + avatarSize / 2, avatarSize / 2 + 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Text
  const memberNum = member.guild?.memberCount ?? 0;
  const name = member.user.username;

  ctx.textAlign = 'center';

  ctx.fillStyle = '#EAF4FF';
  ctx.font = '700 30px Sans';
  ctx.fillText('Welcome to Engineering Hub', Math.floor(W / 2), 150);

  ctx.fillStyle = '#CFE8FF';
  ctx.font = '600 18px Sans';
  ctx.fillText(`You're member #${memberNum}`, Math.floor(W / 2), 178);

  // Subtle username watermark line (very faint)
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#EAF4FF';
  ctx.font = '700 26px Sans';
  ctx.fillText(name.toUpperCase(), Math.floor(W / 2), 225);
  ctx.globalAlpha = 1;

  ctx.textAlign = 'left';

  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

async function fetchToBuffer(url) {
  const res = await fetch(url);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}


// handleAutoMod legacy stub — real logic now in automod.js
async function handleAutoMod(message, type, reason) {
  return;
}

async function updateVouchboard(guild) {
  const vb = await store.getVouchboard(guild.id);
  if (!vb) return;
  try {
    const ch = await guild.channels.fetch(vb.channelId).catch(() => null);
    if (!ch) return;
    const msg = await ch.messages.fetch(vb.messageId).catch(() => null);
    if (!msg) return;
    
    // Show vouch counts for all recorded users (do NOT delete records when they lose roles)
    let list = await store.getVouches(guild.id);

    const desc = list.slice(0, 10).map((v, i) => `${i + 1}. <@${v.userId}> - **${v.vouchers.length}**`).join('\n') || 'No vouches yet.';
    
    const embed = new EmbedBuilder().setTitle('🏆 Vouch Leaderboard').setDescription(desc).setColor(0xD4AF37).setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('vb_page:prev').setLabel('Prev').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('vb_page:next').setLabel('Next').setStyle(ButtonStyle.Secondary)
    );
    await msg.edit({ embeds: [embed], components: [row] });
  } catch (e) {
    console.error('Failed to update vouchboard:', e.message);
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // --- PUBLISH SCHEMATIC: auto-render uploaded .litematic (ticket OR forum thread) ---
  try {
    if (message.guildId && message.attachments?.size) {
      const litematicAttachment = [...message.attachments.values()].find(a => /\.litematic$/i.test(a.name || a.url || ''));
      if (litematicAttachment) {
        // Case A: ticket-channel upload during the original submission flow.
        if (isPublishSchematicTicketChannel(message.channel)) {
          const sub = await store.findSchematicSubmissionByTicketChannel(message.channel.id).catch(() => null);
          if (sub) {
            await message.channel.send({
              embeds: [new EmbedBuilder().setColor(0x08a4a7).setDescription(`🔧 Rendering \`${litematicAttachment.name || 'schematic.litematic'}\` — this may take a few seconds.`)]
            }).catch(() => {});
            const result = await regenerateSchematicRender(message.channel, sub).catch(e => ({ ok: false, reason: e?.message || String(e) }));
            if (!result?.ok) {
              await message.channel.send({
                embeds: [new EmbedBuilder().setColor(0xed4245).setTitle('Render failed').setDescription(result?.reason || 'Unknown error.')]
              }).catch(() => {});
            }
          }
        }
        // Case B: replacement upload inside a forum thread we own. Used by
        // designers to swap a .litematic on an already-published schem
        // without opening a new ticket.
        else if (message.channel.isThread?.() && message.channel.parentId === SCHEMATIC_FORUM_CHANNEL_ID) {
          const sub = await store.findSchematicSubmissionByForumThread(message.channel.id).catch(() => null);
          if (sub && message.member && isAuthorizedToEditSubmission(message.member, sub)) {
            await message.channel.send({
              embeds: [new EmbedBuilder().setColor(0x08a4a7).setDescription(`🔧 New \`.litematic\` detected — re-rendering and updating the post.`)]
            }).catch(() => {});
            const result = await regenerateSchematicRender(message.channel, sub).catch(e => ({ ok: false, reason: e?.message || String(e) }));
            if (!result?.ok) {
              await message.channel.send({
                embeds: [new EmbedBuilder().setColor(0xed4245).setTitle('Render failed').setDescription(result?.reason || 'Unknown error.')]
              }).catch(() => {});
            } else {
              // Re-publish to push the new render + new .litematic to the starter.
              const fresh = await store.getSchematicSubmission(sub.id).catch(() => sub);
              const pubRes = await publishOrUpdateSchematicForumPost(message.guild, fresh).catch(e => ({ ok: false, reason: e?.message || String(e) }));
              if (!pubRes?.ok) {
                await message.channel.send({
                  embeds: [new EmbedBuilder().setColor(0xed4245).setTitle('Forum update failed').setDescription(pubRes?.reason || 'Unknown error.')]
                }).catch(() => {});
              } else {
                await message.channel.send({
                  embeds: [new EmbedBuilder().setColor(0x08a4a7).setDescription(`✅ Forum post updated by ${message.author}.`)]
                }).catch(() => {});
              }
            }
          }
        }
      }
    }
  } catch (e) { console.error('[publish_schematic] auto-render error:', e?.message); }

  // --- ACCEPTED STAFF/BUILDER INFO FLOW ---
  if (!message.guild && acceptedStaffInfoSessions.has(message.author.id)) {
    const sess = acceptedStaffInfoSessions.get(message.author.id);
    const val = String(message.content || '').trim();

    if (sess.step === 'ign') {
      const ign = sanitizeDisplayName(val, { maxLen: 16 });
      if (!ign) {
        await message.channel.send({ embeds: [acceptedInfoEmbed('IGN Required', 'Please reply with your main Minecraft IGN.')] }).catch(() => {});
        return;
      }
      sess.ign = ign;
      sess.step = 'alt_count';
      acceptedStaffInfoSessions.set(message.author.id, sess);
      await message.channel.send({
        embeds: [acceptedInfoEmbed('Alt Accounts', 'Select how many alt accounts you have.')],
        components: [altCountRow(sess.kind, sess.sessionId)]
      }).catch(() => {});
      return;
    }

    if (sess.step === 'alt_igns') {
      const alts = splitIgnList(val, sess.altCount).map(x => sanitizeDisplayName(x, { maxLen: 16 })).filter(Boolean);
      if (alts.length < sess.altCount) {
        await message.channel.send({
          embeds: [acceptedInfoEmbed('Alt IGNs Required', `Please send all ${sess.altCount} alt IGN${sess.altCount === 1 ? '' : 's'}, separated by commas or new lines.`)]
        }).catch(() => {});
        return;
      }
      sess.alts = alts;
      acceptedStaffInfoSessions.set(message.author.id, sess);
      await saveAcceptedStaffInfo(message.author.id);
      acceptedStaffInfoSessions.delete(message.author.id);
      await message.channel.send({ embeds: [new EmbedBuilder().setColor(Colors.Green).setTitle('Info saved').setDescription('Your staff list info has been saved.')] }).catch(() => {});
      return;
    }
  }

  // --- APPLICATIONS: DM answer flow ---
  if (!message.guild && appSessions.has(message.author.id)) {
    const sess = appSessions.get(message.author.id);
    if (Date.now() > sess.expiresAt) {
      await message.channel.send({ embeds: [new EmbedBuilder().setColor(0xed4245).setTitle("Application timed out").setDescription("Please restart the application.")] }).catch(() => {});
      appSessions.delete(message.author.id);
      return;
    }
    if (sess.qIndex >= 0) {
      const type = await store.getAppType(sess.typeId).catch(() => null);
      const qs = Array.isArray(type?.questions) ? type.questions : [];
      const q = qs[sess.qIndex];
      if (!q) { appSessions.delete(message.author.id); return; }

      const val = String(message.content || "").trim();
      if (q.required && !val) {
        await message.channel.send({ embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("This question is required. Please send a response.")] }).catch(() => {});
        return;
      }
      if (typeof q.max === "number" && val.length > q.max) {
        await message.channel.send({ embeds: [new EmbedBuilder().setColor(0xed4245).setDescription("That response is too long. Please try again.")] }).catch(() => {});
        return;
      }

      sess.answers[q.label] = val;
      sess.qIndex += 1;
      sess.awaiting = false;
      appSessions.set(message.author.id, sess);

      try {
        await sendNextAppQuestion(message.author.id);
      } catch (e) {
        console.error('Application next-question error:', e);
        await message.channel.send({ embeds: [new EmbedBuilder().setColor(0xed4245).setDescription('Something went wrong sending the next question. Please try again or restart the application.')] }).catch(() => {});
      }
      return;
    }
  }


  // --- AFK: clear on message ---
  try {
    if (message.guildId) {
      const afkState = await store.getAfk(message.guildId, message.author.id).catch(() => null);
      if (afkState) {
        await store.clearAfk(message.guildId, message.author.id).catch(() => {});
        // Remove [AFK] prefix (and keep vouch suffix if applicable)
        const member = message.member || (message.guild ? await message.guild.members.fetch(message.author.id).catch(() => null) : null);
        if (member) await syncNickname(member).catch(() => {});
      }
    }
  } catch {}

  // --- AFK: mention notice ---
  try {
    if (message.guildId && message.mentions?.users?.size) {
      const mentioned = [...message.mentions.users.values()].slice(0, 5);
      const lines = [];
      for (const u of mentioned) {
        if (!u?.id || u.bot) continue;
        const st = await store.getAfk(message.guildId, u.id).catch(() => null);
        if (!st) continue;
        const why = (st.reason && String(st.reason).trim()) ? String(st.reason).trim() : 'No reason given.';
        lines.push(`<@${u.id}> is AFK: **${why}**`);
      }
      if (lines.length) {
        const afkNotice = await message.reply({ embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription(lines.join('\n'))] }).catch(() => null);
        if (afkNotice) setTimeout(() => afkNotice.delete().catch(() => {}), 30000);
      }
    }
  } catch {}

  // --- VOUCH CHANNEL: auto-detect vouches from messages ─────────────────────
  try {
    if (message.guildId) {
      const vouchChId = C.CHANNEL_VOUCH_DETECTION;
      if (vouchChId && message.channelId === vouchChId) {
        const text = (message.content || '').toLowerCase();
        const hasVouch = /\bvouch\b/.test(text);
        const hasScam  = /\bscam\b|\bscammer\b/.test(text);
        const mentionedId = message.mentions.users.first()?.id;

        // Normal vouch — no scam keyword, mention present, not self-vouch
        if (hasVouch && !hasScam && mentionedId && mentionedId !== message.author.id) {
          const targetMember = await message.guild.members.fetch(mentionedId).catch(() => null);
          if (targetMember && !targetMember.user.bot) {
            const count = await store.addVouch(mentionedId, message.guildId, message.author.id, null);
            if (count !== false) {
              await syncNickname(targetMember).catch(() => {});
              const logChId = await store.getConfigValue(message.guildId, 'CHANNEL_MOD_LOG').catch(() => null) || MOD_LOG_CHANNEL_ID;
              const logCh = logChId && logChId.length > 5 ? await message.guild.channels.fetch(logChId).catch(() => null) : null;
              if (logCh) {
                const cleanMsg = String(message.content || '').replace(/```/g, '\`\`\`').slice(0, 900) || '(no message)';
                await logCh.send({ embeds: [new EmbedBuilder().setColor(0x57f287).setTitle('<:success:1483973364396589177> Vouch Detected')
                  .addFields(
                    { name: 'Vouched', value: `${targetMember}`, inline: true },
                    { name: 'By', value: `${message.author}`, inline: true },
                    { name: 'Total', value: String(count), inline: true },
                    { name: 'Message', value: `\`\`\`${cleanMsg}\`\`\`` },
                  ).setTimestamp()] }).catch(() => {});
              }
            } else {
              // Already vouched this week — react so the voucher knows
              await message.react('⏳').catch(() => {});
            }
          }
        }

        // Scam vouch — keep message, just log + DM alert (no delete)
        if (hasVouch && hasScam && mentionedId) {
          const targetMember = await message.guild.members.fetch(mentionedId).catch(() => null);
          const isStaffTarget = targetMember && isStaffMember(targetMember, await store.getTicketConfig().catch(() => ({})));
          const alertUserId = await store.getConfigValue(message.guildId, 'VOUCH_SCAM_ALERT_USER').catch(() => null);
          if (alertUserId) {
            const alertUser = await client.users.fetch(alertUserId).catch(() => null);
            if (alertUser) {
              const dm = await alertUser.createDM().catch(() => null);
              if (dm) {
                const cleanDmMsg = String(message.content || '').replace(/```/g, '\`\`\`').slice(0, 500) || '(no message)';
                await dm.send({ embeds: [new EmbedBuilder()
                  .setColor(0xed4245)
                  .setTitle('<:failure:1483973329626075257> Scam Vouch Attempt')
                  .setDescription(`**From:** ${message.author}\n**Target:** <@${mentionedId}>${isStaffTarget ? ' (staff)' : ''}\n**Channel:** <#${message.channelId}>`)
                  .addFields({ name: 'Message', value: `\`\`\`${cleanDmMsg}\`\`\`` })
                  .setTimestamp()] }).catch(() => {});
              }
            }
          }
          // Log to mod log channel too
          const logChId = await store.getConfigValue(message.guildId, 'CHANNEL_MOD_LOG').catch(() => null) || MOD_LOG_CHANNEL_ID;
          const logCh = logChId && logChId.length > 5 ? await message.guild.channels.fetch(logChId).catch(() => null) : null;
          if (logCh) {
            const cleanMsg = String(message.content || '').replace(/```/g, '\`\`\`').slice(0, 900) || '(no message)';
            await logCh.send({ embeds: [new EmbedBuilder().setColor(0xed4245).setTitle('<:failure:1483973329626075257> Scam Vouch Attempt')
              .addFields(
                { name: 'From', value: `${message.author}`, inline: true },
                { name: 'Target', value: `<@${mentionedId}>${isStaffTarget ? ' (staff)' : ''}`, inline: true },
                { name: 'Message', value: `\`\`\`${cleanMsg}\`\`\`` },
              ).setTimestamp()] }).catch(() => {});
          }
        }
      }
    }
  } catch {}

  // --- TICKETS/GENERAL: track staff message stats ---
  try {
    if (message.guildId && !message.author?.bot) {
      const cfg = await store.getTicketConfig().catch(() => null);
      if (cfg) {
        const member = message.member || await message.guild.members.fetch(message.author.id).catch(() => null);
        if (isStaffMember(member, cfg)) {
          await store.recordTicketMessage(message.guildId, message.author.id).catch(() => {});
        }
      }

      if (message.channel?.type === ChannelType.GuildText) {
        const rec = await store.getTicketRecord(message.channelId).catch(() => null);
        if (rec && rec.status === 'OPEN') {
          const isStaff = cfg ? isStaffMember(message.member, cfg) : false;
          if (isStaff) {
            if (!rec.firstStaffMessageAt) {
              await store.updateTicketRecord(message.channelId, {
                firstStaffMessageAt: Date.now(),
                firstResponderId: message.author.id
              }).catch(() => {});
            }
          }
        }
      }
    }
  } catch {}

  // --- ATTACHMENT LOCK: only Rare+ can send images/files or GIFs in the configured channel ---
  try {
    if (message.channelId === MEDIA_LOCK_CHANNEL_ID) {
      const member = message.member || (message.guild ? await message.guild.members.fetch(message.author.id).catch(() => null) : null);
      const isStaff = member?.permissions?.has(PermissionsBitField.Flags.ManageMessages) || member?.permissions?.has(PermissionsBitField.Flags.Administrator) || hasStaffRole(member);
      const isRarePlus = !!member && MEDIA_ALLOWED_ROLE_IDS.some(rid => member.roles.cache.has(rid));

      // Block attachments (images, files)
      if (message.attachments && message.attachments.size > 0) {
        if (!isStaff && !isRarePlus) {
          await message.delete().catch(() => {});
          const warn = await message.channel.send({ content: `${message.author} you need **Rare** rank or higher to send images/files in this channel.` }).catch(() => null);
          if (warn) setTimeout(() => warn.delete().catch(() => {}), 6000);
          return;
        }
      }

      // Block GIFs (tenor/giphy embeds and .gif links)
      const isGif = (message.embeds?.some(e => e.type === 'gifv' || /tenor\.com|giphy\.com/i.test(e.url || ''))) ||
                    /https?:\/\/[^\s]+(tenor\.com|giphy\.com)[^\s]*/i.test(message.content) ||
                    (message.attachments?.some(a => a.name?.toLowerCase().endsWith('.gif')));
      if (isGif && !isStaff && !isRarePlus) {
        await message.delete().catch(() => {});
        const warn = await message.channel.send({ content: `${message.author} you need **Rare** rank or higher to send GIFs in this channel.` }).catch(() => null);
        if (warn) setTimeout(() => warn.delete().catch(() => {}), 6000);
        return;
      }
    }
  } catch (e) {
    console.error('Attachment lock error:', e);
  }

  // --- XP SYSTEM ---
  try {
    const userData = await store.getUserXp(message.author.id, message.guildId);
    if (Date.now() - userData.lastXpTime > 60000) {
      const baseXpGain = Math.floor(Math.random() * (50 - 30 + 1)) + 30;
      const chMult = await store.getChannelXpMultiplier(message.channelId);
      const globalMult = await store.getXpMultiplierGlobal();
      let mult = (typeof chMult === 'number' && chMult > 0) ? chMult : globalMult;

      const member = message.member || (message.guild ? await message.guild.members.fetch(message.author.id).catch(() => null) : null);

      const xpGain = Math.max(1, Math.floor(baseXpGain * mult)); 
      const newTotal = await store.addXp(message.author.id, message.guildId, xpGain);
      
      const oldLevel = getLevelFromXp(userData.xp); 
      const newLevel = getLevelFromXp(newTotal);

      // Keep rank roles in sync even if roles were removed manually or bot restarted
      if (member) {
        await syncLevelRoles(member, newLevel).catch(() => {});
      }

      if (newLevel > oldLevel) {
        // Ensure XP/level data is persisted immediately on level-up
        await store.flushNow().catch(() => {});
        await handleLevelUp(member || message.member, newLevel, oldLevel, newTotal);
      }
    }
  } catch (e) { console.error('XP Error:', e); }


  // --- STICKY MESSAGE LOGIC (Updated to loop through all stickies) ---
  const stickies = await store.getStickies(message.channelId);
  if (stickies && stickies.length > 0) {
    for (const sticky of stickies) {
        try {
          if (sticky.lastMessageId) {
            const oldMsg = await message.channel.messages.fetch(sticky.lastMessageId).catch(() => null);
            if (oldMsg) await oldMsg.delete().catch(() => {});
          }
          const embeds = [];
          if (sticky.embed && (String(sticky.embed.description || '').trim() || String(sticky.embed.title || '').trim())) {
            const eb = new EmbedBuilder();
            if (sticky.embed.title) eb.setTitle(String(sticky.embed.title).slice(0, 256));
            if (String(sticky.embed.description || '').trim()) eb.setDescription(String(sticky.embed.description));
            if (sticky.embed.color) eb.setColor(sticky.embed.color);
            embeds.push(eb);
          }
          const payload = { content: sticky.content || null };
          if (embeds.length) payload.embeds = embeds;
          const newMsg = await message.channel.send(payload);
          await store.updateStickyMessageId(sticky.id, newMsg.id);
        } catch (e) { console.error('Sticky Error:', e); }
    }
  }
});

// --- INTERACTIONS ---
client.on('interactionCreate', async (interaction) => {
  // ------------------------------------------------------------
  // FAST-PATH: component interactions that must respond <3s.
  // If we do slow awaits before showModal, Discord returns 10062.
  // ------------------------------------------------------------
  try {
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('embed_edit_select:')) {
      const sessionId = interaction.customId.split(':')[1];
      const session = embedEditSessions.get(sessionId);
      if (!session || session.userId !== interaction.user.id || session.channelId !== interaction.channelId) return;

      const messageId = interaction.values?.[0];
      const snap = messageId ? session.entries.get(messageId) : null;
      if (!snap) return;
      const editValues = getEmbedEditModalValues(snap);

      const modal = new ModalBuilder()
        .setCustomId(`edit_embed_modal:${interaction.channelId}:${messageId}`)
        .setTitle('Edit Embed Message');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('edit_embed_content')
            .setLabel('Message Content (Optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setValue(editValues.content)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('edit_embed_title')
            .setLabel('Embed Title (Optional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(editValues.title)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('edit_embed_desc')
            .setLabel('Embed Description (Optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setValue(editValues.description)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('edit_embed_color')
            .setLabel('Embed Color (Hex)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(editValues.color)
        )
      );

      await interaction.showModal(modal);
      embedEditSessions.delete(sessionId);
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('sticky_edit_select:')) {
      const sessionId = interaction.customId.split(':')[1];
      const session = stickyEditSessions.get(sessionId);
      if (!session || session.userId !== interaction.user.id || session.channelId !== interaction.channelId) return;

      const stickyId = interaction.values?.[0];
      const snap = stickyId ? session.entries.get(stickyId) : null;
      if (!snap) return;

      const modal = new ModalBuilder()
        .setCustomId(`sticky_edit_modal:${stickyId}`)
        .setTitle('Edit Sticky Message');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('sticky_content')
            .setLabel('Message Text (Optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setValue(snap.content || '')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('sticky_embed_title')
            .setLabel('Embed Title (Optional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(snap.title || '')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('sticky_embed_desc')
            .setLabel('Embed Description (Optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setValue(snap.description || '')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('sticky_embed_color')
            .setLabel('Embed Color (Hex)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(snap.color || '#2b2d31')
        )
      );

      await interaction.showModal(modal);
      stickyEditSessions.delete(sessionId);
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith('accepted_info_main_open:')) {
      const [, kind, sessionId] = interaction.customId.split(':');
      getOrCreateAcceptedInfoSession(interaction.user.id, kind, sessionId);
      await interaction.showModal(acceptedMainIgnModal(kind, sessionId)).catch(() => {});
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('accepted_info_main:')) {
      const [, kind, sessionId] = interaction.customId.split(':');
      const sess = getOrCreateAcceptedInfoSession(interaction.user.id, kind, sessionId);
      const ign = sanitizeDisplayName(interaction.fields.getTextInputValue('main_ign'), { maxLen: 16 });
      if (!ign) {
        await interaction.reply({ embeds: [acceptedInfoEmbed('IGN Required', 'Please submit your main Minecraft IGN again.')] }).catch(() => {});
        return;
      }
      sess.ign = ign;
      sess.step = 'alt_count';
      acceptedStaffInfoSessions.set(interaction.user.id, sess);
      await interaction.reply({
        embeds: [acceptedInfoEmbed('Alt Accounts', 'Select how many alt accounts you have.')],
        components: [altCountRow(kind, sessionId)]
      }).catch(() => {});
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('accepted_info_alts:')) {
      const [, kind, sessionId, countRaw] = interaction.customId.split(':');
      const count = Math.max(1, Math.min(5, Number(countRaw || 1) || 1));
      const sess = acceptedStaffInfoSessions.get(interaction.user.id);
      if (!sess || sess.sessionId !== sessionId || sess.kind !== kind || !sess.ign) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(0xed4245).setTitle('Session expired').setDescription('Please contact management to restart staff info collection.')]
        }).catch(() => {});
        return;
      }
      const alts = [];
      for (let i = 1; i <= count; i += 1) {
        const alt = sanitizeDisplayName(interaction.fields.getTextInputValue(`alt_${i}`), { maxLen: 16 });
        if (alt) alts.push(alt);
      }
      if (alts.length < count) {
        await interaction.reply({ embeds: [acceptedInfoEmbed('Alt IGNs Required', `Please submit all ${count} alt IGN${count === 1 ? '' : 's'}.`)] }).catch(() => {});
        return;
      }
      sess.altCount = count;
      sess.alts = alts;
      sess.step = 'done';
      acceptedStaffInfoSessions.set(interaction.user.id, sess);
      await saveAcceptedStaffInfo(interaction.user.id);
      acceptedStaffInfoSessions.delete(interaction.user.id);
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(Colors.Green).setTitle('Info saved').setDescription('Your staff list info has been saved.')] }).catch(() => {});
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('accepted_info_alt:')) {
      const parts = interaction.customId.split(':');
      const kind = parts.length >= 3 ? parts[1] : acceptedStaffInfoSessions.get(interaction.user.id)?.kind;
      const sessionId = parts.length >= 3 ? parts[2] : parts[1];
      const sess = acceptedStaffInfoSessions.get(interaction.user.id);
      if (!sess || sess.sessionId !== sessionId || sess.kind !== kind) {
        await interaction.update({
          embeds: [new EmbedBuilder().setColor(0xed4245).setTitle('Session expired').setDescription('Please contact management to restart staff info collection.')],
          components: []
        }).catch(() => {});
        return;
      }

      const count = Math.max(0, Math.min(5, Number(interaction.values?.[0] || 0) || 0));
      sess.altCount = count;
      sess.step = count > 0 ? 'alt_igns' : 'done';
      acceptedStaffInfoSessions.set(interaction.user.id, sess);

      if (count === 0) {
        sess.alts = [];
        await saveAcceptedStaffInfo(interaction.user.id);
        acceptedStaffInfoSessions.delete(interaction.user.id);
        await interaction.update({
          embeds: [new EmbedBuilder().setColor(Colors.Green).setTitle('Info saved').setDescription('Your staff list info has been saved.')],
          components: []
        }).catch(() => {});
        return;
      }

      await interaction.showModal(acceptedAltIgnsModal(kind, sessionId, count)).catch(() => {});
      return;
    }

    // --- DROPDOWN: use select -> ephemeral output ---
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('dd_use:')) {
      const panelId = interaction.customId.split(':')[1];
      const val = interaction.values?.[0] || '';
      const [, optKey] = val.split('|');
      const panel = await store.getDropdownPanel(panelId);
      const opt = panel?.options?.[optKey];
      if (!opt) return interaction.reply({ content: 'Option not found.', flags: 64 });

      const embeds = [];
      if (opt.embed && (opt.embed.title || opt.embed.description)) {
        const eb = new EmbedBuilder();
        if (opt.embed.title) eb.setTitle(opt.embed.title);
        if (opt.embed.description) eb.setDescription(opt.embed.description);
        if (opt.embed.color) {
          try { eb.setColor(opt.embed.color); } catch {}
        }
        embeds.push(eb);
      }

      const components = [];
      if (panelId === 'farms') {
        const buyBtn = new ButtonBuilder()
          .setCustomId(`tk_ddbuy:${panelId}:${optKey}`)
          .setLabel('Buy')
          .setStyle(ButtonStyle.Success)
        components.push(new ActionRowBuilder().addComponents(buyBtn));
      }

      return interaction.reply({
        content: opt.content || null,
        embeds,
        components,
        flags: 64
      });
    }


// --- BUILD QUEUE: handle all bq_* interactions (fast-path) ---
  if (interaction.customId?.startsWith('bq_')) {
    await buildQueue.handleInteraction(interaction, store).catch(e => {
      console.error('[BuildQueue] interaction error:', e);
    });
    return;
  }
  // bq_open with key (from panel buttons)
  if (interaction.isButton() && (interaction.customId === 'bq_open:base' || interaction.customId === 'bq_open:mining' || interaction.customId === 'bq_open')) {
    const buildType = interaction.customId.split(':')[1] || 'base';
    await buildQueue.handleInteraction({ ...interaction, customId: `bq_open:${buildType}` }, store).catch(e => {
      console.error('[BuildQueue] bq_open error:', e);
    });
    return;
  }

// --- SPAWNER PRICES PANEL: Buy/Sell button -> type dropdown (ephemeral) ---
if (interaction.isButton() && interaction.customId.startsWith('spawner_open:')) {
  const direction = interaction.customId.split(':')[1];
  if (!['buy','sell'].includes(direction)) {
    return interaction.reply({ content: 'Unknown action.', flags: 64 }).catch(() => {});
  }
  const select = new StringSelectMenuBuilder()
    .setCustomId(`spawner_type:${direction}`)
    .setPlaceholder(`Select a spawner type to ${direction}…`)
    .addOptions(SPAWNER_TYPES.map(t => ({
      label: t.label,
      value: t.key,
    })));
  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x08a4a7)
      .setDescription(`Select the spawner type you want to ${direction}.`)],
    components: [new ActionRowBuilder().addComponents(select)],
    flags: 64,
  }).catch(() => {});
  return;
}

// --- SPAWNER PRICES PANEL: type dropdown -> quantity modal ---
if (interaction.isStringSelectMenu() && interaction.customId.startsWith('spawner_type:')) {
  const direction = interaction.customId.split(':')[1];
  const typeKey = interaction.values?.[0];
  const type = getSpawnerType(typeKey);
  if (!type || !['buy','sell'].includes(direction)) {
    return interaction.reply({ content: 'Invalid spawner selection.', flags: 64 }).catch(() => {});
  }
  const modal = new ModalBuilder()
    .setCustomId(`spawner_modal:${direction}:${type.key}`)
    .setTitle(`${direction === 'buy' ? 'Buy' : 'Sell'} ${type.label}`.slice(0, 45));
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('ign')
        .setLabel('What is your IGN?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(40),
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('qty')
        .setLabel(`How many (number only, min ${spawnerMinQtyFor(type.key)})?`)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(10),
    ),
  );
  await interaction.showModal(modal).catch(() => {});
  return;
}

// --- PUBLISH SCHEMATIC: Start / Edit basics / Edit extras buttons -> modals ---
if (interaction.isButton() && (
  interaction.customId.startsWith('publish_start:') ||
  interaction.customId.startsWith('publish_edit_basics:') ||
  interaction.customId.startsWith('publish_edit_extras:')
)) {
  const subId = interaction.customId.split(':')[1];
  const sub = await store.getSchematicSubmission(subId).catch(() => null);
  if (!sub) return interaction.reply({ content: 'Submission record missing — open a fresh Publish Schematic ticket.', flags: 64 }).catch(() => {});
  if (!isAuthorizedToEditSubmission(interaction.member, sub)) {
    return interaction.reply({ content: 'Only the submitter, a listed designer, or a schematic manager can edit this submission.', flags: 64 }).catch(() => {});
  }
  const wantExtras = interaction.customId.startsWith('publish_edit_extras:');
  const modal = wantExtras ? buildSchematicExtrasModal(sub) : buildSchematicBasicsModal(sub);
  await interaction.showModal(modal).catch(() => {});
  return;
}

// --- PUBLISH SCHEMATIC: forum-side Edit button -> ephemeral edit panel ---
if (interaction.isButton() && interaction.customId.startsWith('publish_edit_forum:')) {
  const subId = interaction.customId.split(':')[1];
  const sub = await store.getSchematicSubmission(subId).catch(() => null);
  if (!sub) return interaction.reply({ content: 'Submission record missing.', flags: 64 }).catch(() => {});
  if (!isAuthorizedToEditSubmission(interaction.member, sub)) {
    return interaction.reply({ content: 'Only the submitter, a listed designer, or a schematic manager can edit this submission.', flags: 64 }).catch(() => {});
  }
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`publish_edit_basics:${sub.id}`).setLabel('Edit Basics').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
    new ButtonBuilder().setCustomId(`publish_edit_extras:${sub.id}`).setLabel('Edit Extras').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
  );
  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x08a4a7)
      .setTitle(`Editing — ${sub.name || 'Untitled Schematic'}`)
      .setDescription([
        'Use the buttons below to edit text. Changes auto-publish to this thread.',
        '',
        '**To replace the schematic file:** drop a new `.litematic` directly in this forum thread. The bot will re-render and update the post automatically.',
      ].join('\n'))],
    components: [row],
    flags: 64,
  }).catch(() => {});
  return;
}

// --- PUBLISH SCHEMATIC: Re-render button ---
if (interaction.isButton() && interaction.customId.startsWith('publish_rerender:')) {
  const subId = interaction.customId.split(':')[1];
  const sub = await store.getSchematicSubmission(subId).catch(() => null);
  if (!sub) return interaction.reply({ content: 'Submission record missing.', flags: 64 }).catch(() => {});
  const isOwner = String(interaction.user.id) === String(sub.submitterId);
  if (!isOwner && !canManageSchematicSubmission(interaction.member)) {
    return interaction.reply({ content: 'Only the submitter or a schematic manager can re-render.', flags: 64 }).catch(() => {});
  }
  await interaction.deferReply({ flags: 64 }).catch(() => {});
  const ch = await interaction.guild.channels.fetch(sub.ticketChannelId).catch(() => null);
  if (!ch) return safeIReply(interaction, { content: 'Ticket channel not found.', flags: 64 });
  const res = await regenerateSchematicRender(ch, sub);
  return safeIReply(interaction, { content: res.ok ? '✅ Re-rendered.' : `❌ ${res.reason}`, flags: 64 });
}

// --- PUBLISH SCHEMATIC: Publish-to-Forum button ---
if (interaction.isButton() && interaction.customId.startsWith('publish_post:')) {
  const subId = interaction.customId.split(':')[1];
  const sub = await store.getSchematicSubmission(subId).catch(() => null);
  if (!sub) return interaction.reply({ content: 'Submission record missing.', flags: 64 }).catch(() => {});
  if (!canManageSchematicSubmission(interaction.member)) {
    return interaction.reply({ content: 'Only a schematic manager can publish.', flags: 64 }).catch(() => {});
  }
  await interaction.deferReply({ flags: 64 }).catch(() => {});
  // Validate required fields
  const missing = [];
  if (!sub.name) missing.push('name');
  if (!sub.designers || !parseDesignerLines(sub.designers).length) missing.push('designers');
  if (!sub.howto) missing.push('how-to-use');
  if (!sub.renderUrl) missing.push('render');
  if (!sub.litematicUrl) missing.push('.litematic');
  if (missing.length) return safeIReply(interaction, { content: `❌ Cannot publish — missing: ${missing.join(', ')}.`, flags: 64 });

  const res = await publishOrUpdateSchematicForumPost(interaction.guild, sub);
  if (!res.ok) return safeIReply(interaction, { content: `❌ ${res.reason}`, flags: 64 });

  const verb = res.updated ? 'Updated' : 'Published';
  const ch = await interaction.guild.channels.fetch(sub.ticketChannelId).catch(() => null);
  if (ch) {
    await ch.send({
      embeds: [new EmbedBuilder().setColor(0x08a4a7).setTitle(verb).setDescription(`This schematic has been ${verb.toLowerCase()} in <#${res.thread.id}>.`)],
    }).catch(() => {});
    // Refresh the pinned draft preview so its button label flips to "Update Forum Post".
    const fresh = await store.getSchematicSubmission(sub.id).catch(() => sub);
    await postOrUpdateSchematicDraftPreview(ch, fresh).catch(() => {});
  }
  return safeIReply(interaction, { content: `✅ ${verb} → <#${res.thread.id}>`, flags: 64 });
}

// --- TICKETS: panel button -> show modal (FAST) ---
if (interaction.isButton() && interaction.customId.startsWith('tk_open:')) {
  const parts = interaction.customId.split(':');
  const panelId = parts[1];
  const buttonKey = parts[2];
  const panel = await store.getTicketPanel(panelId);

  // Load button config from DB panel first (covers ticket_center, building_services, applications)
  let btn = null;
  if (panel) {
    const flat = Array.isArray(panel.components) ? panel.components.flat() : [];
    btn = flat.find(c => c.type === 'button' && c.key === buttonKey);
  }

  // If the panel button has a categoryId from the OLD server, remap it to the new server's category
  if (btn?.categoryId) {
    const remapped = await resolvePanelCategory(interaction.guildId, panelId);
    if (remapped) btn = { ...btn, categoryId: remapped };
  }

  if (!panel || !btn) return interaction.reply({ content: "Panel/button not found.", flags: 64 });

  const cfg = await store.getTicketConfig();
  if (cfg?.oneOpenPerButton) {
    const existing = await store.findOpenTicketByUserButton(interaction.guildId, interaction.user.id, panelId, buttonKey);
    if (existing) {
      // Verify the channel actually still exists — user may have had it deleted manually
      const existingCh = await interaction.guild.channels.fetch(existing.channelId).catch(() => null);
      if (!existingCh) {
        // Channel gone — clear stale record so they can open a new ticket
        await store.updateTicketRecord(existing.channelId, { status: 'CLOSED' }).catch(() => {});
      } else {
        return interaction.reply({ content: `You already have an open **${btn.label}** ticket: <#${existing.channelId}>`, flags: 64 });
      }
    }
  }

  const modalId = `tk_modal:${panelId}:${buttonKey}`;
  const qNoMin = (btn.questions || []).map(q => ({ ...q, min: undefined }));
  const modal = buildQuestionsModal(modalId, btn.label, qNoMin);
  await interaction.showModal(modal);
  return;
}

// --- TICKETS: dropdown farms buy -> show modal (FAST) ---
if (interaction.isButton() && interaction.customId.startsWith('tk_ddbuy:')) {
  const parts = interaction.customId.split(':');
  const panelId = parts[1];
  const optKey = parts[2];
  if (panelId !== "farms") return interaction.reply({ content: "Unknown dropdown.", flags: 64 });
  const dp = await store.getDropdownPanel(panelId);
  const opt = dp?.options?.[optKey];
  if (!opt) return interaction.reply({ content: "Option not found.", flags: 64 });

  const tsPanel = await store.getTicketPanel("building_services");
  const flat = Array.isArray(tsPanel?.components) ? tsPanel.components.flat() : [];
  const ddComp = flat.find(c => c.type === "dropdown" && c.dropdownId === "farms");
  const buyCfg = ddComp?.buyButton;
  if (!buyCfg) return interaction.reply({ content: "Buy config missing.", flags: 64 });

  const modalId = `tk_modal_dd:farms:${optKey}`;
  const modal = buildQuestionsModal(modalId, "Building Service", buyCfg.questions || []);
  await interaction.showModal(modal);
  return;
}

// --- APPLICATIONS: start -> DM flow (FAST ack) ---
if (interaction.isButton() && interaction.customId.startsWith('app_start:')) {
  const typeId = interaction.customId.split(':')[1];
  const type = await store.getAppType(typeId).catch(() => null);
  const cooldown = await getApplicationCooldown(interaction.user.id, typeId);
  if (cooldown.blocked) {
    await interaction.reply({ embeds: [applicationCooldownEmbed(type?.title || typeId, cooldown)], flags: 64 }).catch(() => {});
    return;
  }

  // Gate: if /application <type> close was used, refuse here too even if the
  // button hadn't been re-rendered yet.
  const isClosed = await store.getAppClosed(typeId).catch(() => false);
  if (isClosed) {
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0xed4245).setTitle('Applications closed').setDescription(`**${typeId}** applications are currently closed.`)],
      flags: 64,
    }).catch(() => {});
    return;
  }

  const eb = new EmbedBuilder()
    .setColor(Colors.Green)
    .setTitle("Application started")
    .setDescription("Application has been started in your direct messages!");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Jump to application").setStyle(ButtonStyle.Link).setURL("https://discord.com/channels/@me")
  );

  await interaction.reply({ embeds: [eb], components: [row], flags: 64 }).catch(() => {});
  try { startApplicationDmFlow(interaction, typeId); } catch {}
  return;
}
  } catch (err) {
    console.error('FAST-PATH component error:', err);
    return;
  }
  // --- SPAWNER PRICES PANEL: quantity modal -> create spawner ticket ---
  if (interaction.isModalSubmit() && interaction.customId.startsWith('spawner_modal:')) {
    await interaction.deferReply({ flags: 64 }).catch(() => {});
    const parts = interaction.customId.split(':');
    const direction = parts[1];               // 'buy' | 'sell'
    const typeKey = parts[2];
    const type = getSpawnerType(typeKey);
    if (!type || !['buy','sell'].includes(direction)) {
      return safeIReply(interaction, { content: '❌ Invalid spawner selection.', flags: 64 });
    }
    const ign = (interaction.fields.getTextInputValue('ign') || '').trim().slice(0, 40);
    const qtyRaw = (interaction.fields.getTextInputValue('qty') || '').trim();
    const qty = parseInt(String(qtyRaw).replace(/[^0-9]/g, ''), 10);
    const minQty = spawnerMinQtyFor(type.key);
    if (!ign) return safeIReply(interaction, { content: '❌ Please enter your IGN.', flags: 64 });
    if (!Number.isFinite(qty) || qty <= 0) {
      return safeIReply(interaction, { content: '❌ Quantity must be a positive number.', flags: 64 });
    }
    if (qty < minQty) {
      return safeIReply(interaction, { content: `❌ Minimum quantity for **${type.label}** is **${minQty}**.`, flags: 64 });
    }

    // One open ticket per user per spawner direction (mirrors oneOpenPerButton)
    const cfg = await store.getTicketConfig();
    const buttonKey = direction === 'buy' ? 'spawner_buy' : 'spawner_sell';
    if (cfg?.oneOpenPerButton) {
      const existing = await store.findOpenTicketByUserButton(interaction.guildId, interaction.user.id, 'spawner_prices', buttonKey).catch(() => null);
      if (existing) {
        const existingCh = await interaction.guild.channels.fetch(existing.channelId).catch(() => null);
        if (existingCh) {
          return safeIReply(interaction, { content: `You already have an open **${direction === 'buy' ? 'Spawner Buy' : 'Spawner Sell'}** ticket: <#${existing.channelId}>`, flags: 64 });
        }
        await store.updateTicketRecord(existing.channelId, { status: 'CLOSED' }).catch(() => {});
      }
    }

    const categoryId = direction === 'buy' ? C.TICKET_CATEGORIES.SPAWNER_BUY : C.TICKET_CATEGORIES.SPAWNER_SELL;
    const btnCfg = {
      key: buttonKey,
      // Welcome embed shows just "Spawner Buy" / "Spawner Sell" — the type
      // appears in the pinned price embed instead.
      label: direction === 'buy' ? 'Spawner Buy' : 'Spawner Sell',
      categoryId,
      welcome: `Welcome {userMention}! A staff member will be with you shortly.`,
      questions: [],
    };

    // Channel name uses the quantity the user actually requested, not a
    // per-type ticket counter. Staff sees "creeper-432" at a glance instead
    // of an opaque sequential number.
    const desiredName = `${type.shortName}-${qty}`.slice(0, 90);

    let channel;
    try {
      channel = await createTicketChannel({
        interaction,
        panelId: 'spawner_prices',
        buttonKey,
        btnCfg,
        // Skip the auto-generated QA embed — IGN + quantity are surfaced
        // in the price embed that follows, no need to duplicate.
        answers: {},
        nameOverride: desiredName,
        // Don't pin the welcome+controls message; only the price embed below
        // gets pinned so it stays prominent in the ticket.
        skipPinControl: true,
      });
    } catch (e) {
      console.error('[spawner ticket] create error:', e);
      return safeIReply(interaction, { content: '❌ Failed to create ticket.', flags: 64 });
    }

    // Persist spawner-specific metadata on the ticket record so /ticket rename
    // and future status-syncs respect it.
    try {
      await store.updateTicketRecord(channel.id, {
        channelBaseName: desiredName,
        manualRename: true,
        spawnerType: type.key,
        spawnerDirection: direction,
        spawnerQty: qty,
      });
    } catch (e) {
      console.error('[spawner ticket] update record error:', e?.message);
    }

    // Send price embed (or "not buying" notice) inside the ticket.
    // direction is from the CUSTOMER's perspective:
    //   - direction='buy'  → customer buys from us → we sell → use shop's SELL price
    //   - direction='sell' → customer sells to us  → we buy  → use shop's BUY price
    try {
      const prices = await store.getSpawnerPrices().catch(() => ({}));
      const priceColumn = direction === 'buy' ? 'sell' : 'buy';
      const priceVal = prices?.[type.key]?.[priceColumn];
      const priceStr = fmtSpawnerPrice(priceVal);
      let embed;
      if (priceStr) {
        const verb = direction === 'buy' ? 'selling' : 'buying';
        embed = new EmbedBuilder()
          .setColor(0x08a4a7)
          .setTitle(`${type.label} — ${direction === 'buy' ? 'Buy' : 'Sell'} Price`)
          .setDescription(`We are currently **${verb}** ${type.emoji} **${type.label}** spawners at **${priceStr}** each.`)
          .addFields(
            { name: 'Quantity Requested', value: `**${qty}**`, inline: true },
            { name: 'Estimated Total', value: `**${fmtSpawnerPrice(qty * Number(priceVal))}**`, inline: true },
            { name: 'IGN', value: `\`${ign}\``, inline: true },
          )
          .setFooter({ text: 'Prices are not negotiable.' });
      } else {
        const verbing = direction === 'buy' ? 'selling' : 'buying';
        embed = new EmbedBuilder()
          .setColor(0x08a4a7)
          .setTitle(`${type.label} — No Active ${direction === 'buy' ? 'Buy' : 'Sell'} Price`)
          .setDescription(`We are not currently **${verbing}** ${type.emoji} **${type.label}** spawners. This ticket will stay open in case a staff member wants to handle it.`)
          .addFields(
            { name: 'Quantity', value: `**${qty}**`, inline: true },
            { name: 'IGN', value: `\`${ign}\``, inline: true },
          );
      }
      const priceMsg = await channel.send({ embeds: [embed] }).catch(() => null);
      if (priceMsg) {
        try { await priceMsg.pin(); } catch (e) { console.error('[spawner ticket] pin error:', e?.message); }
      }
    } catch (e) {
      console.error('[spawner ticket] embed error:', e?.message);
    }

    const visible = !!(channel && channel.permissionsFor?.(interaction.user)?.has?.(PermissionsBitField.Flags.ViewChannel));
    return safeIReply(interaction, { content: visible ? `✅ Ticket created: <#${channel.id}>` : '✅ Ticket created.', flags: 64 });
  }

  // --- PUBLISH SCHEMATIC: modal 1 submit -> save basics + refresh preview ---
  if (interaction.isModalSubmit() && interaction.customId.startsWith('publish_modal_basics:')) {
    await interaction.deferReply({ flags: 64 }).catch(() => {});
    const subId = interaction.customId.split(':')[1];
    const sub = await store.getSchematicSubmission(subId).catch(() => null);
    if (!sub) return safeIReply(interaction, { content: 'Submission record missing.', flags: 64 });

    if (!isAuthorizedToEditSubmission(interaction.member, sub)) {
      return safeIReply(interaction, { content: 'Only the submitter, a listed designer, or a schematic manager can edit this submission.', flags: 64 });
    }

    const patch = {
      name:      (interaction.fields.getTextInputValue('name')      || '').trim().slice(0, 256),
      designers: (interaction.fields.getTextInputValue('designers') || '').trim(),
      rates:     (interaction.fields.getTextInputValue('rates')     || '').trim(),
      build:     (interaction.fields.getTextInputValue('build')     || '').trim(),
      howto:     (interaction.fields.getTextInputValue('howto')     || '').trim(),
      updatedAt: Date.now(),
    };
    const updated = await store.updateSchematicSubmission(subId, patch);
    const finalSub = updated || { ...sub, ...patch };

    // If the ticket is still open, refresh the pinned draft preview.
    const channel = await interaction.guild.channels.fetch(sub.ticketChannelId).catch(() => null);
    if (channel) await postOrUpdateSchematicDraftPreview(channel, finalSub).catch(() => {});

    // If the schem is already published, auto-sync the forum thread starter
    // so designer edits are immediately visible without manual /publish post.
    let republishNote = '';
    if (finalSub.status === 'PUBLISHED' && finalSub.forumThreadId) {
      const res = await publishOrUpdateSchematicForumPost(interaction.guild, finalSub).catch(e => ({ ok: false, reason: e?.message || String(e) }));
      republishNote = res?.ok
        ? ` Forum thread updated.`
        : `\n⚠️ Could not auto-update forum thread: ${res?.reason}`;
    }

    return safeIReply(interaction, { content: `✅ Basics saved.${republishNote}`, flags: 64 });
  }

  // --- PUBLISH SCHEMATIC: modal 2 submit -> save extras + refresh preview ---
  if (interaction.isModalSubmit() && interaction.customId.startsWith('publish_modal_extras:')) {
    await interaction.deferReply({ flags: 64 }).catch(() => {});
    const subId = interaction.customId.split(':')[1];
    const sub = await store.getSchematicSubmission(subId).catch(() => null);
    if (!sub) return safeIReply(interaction, { content: 'Submission record missing.', flags: 64 });

    if (!isAuthorizedToEditSubmission(interaction.member, sub)) {
      return safeIReply(interaction, { content: 'Only the submitter, a listed designer, or a schematic manager can edit this submission.', flags: 64 });
    }

    const patch = {
      credits:   (interaction.fields.getTextInputValue('credits')   || '').trim(),
      consumes:  (interaction.fields.getTextInputValue('consumes')  || '').trim(),
      positives: (interaction.fields.getTextInputValue('positives') || '').trim(),
      negatives: (interaction.fields.getTextInputValue('negatives') || '').trim(),
      updatedAt: Date.now(),
    };
    const updated = await store.updateSchematicSubmission(subId, patch);
    const finalSub = updated || { ...sub, ...patch };

    const channel = await interaction.guild.channels.fetch(sub.ticketChannelId).catch(() => null);
    if (channel) await postOrUpdateSchematicDraftPreview(channel, finalSub).catch(() => {});

    let republishNote = '';
    if (finalSub.status === 'PUBLISHED' && finalSub.forumThreadId) {
      const res = await publishOrUpdateSchematicForumPost(interaction.guild, finalSub).catch(e => ({ ok: false, reason: e?.message || String(e) }));
      republishNote = res?.ok ? ' Forum thread updated.' : `\n⚠️ Could not auto-update forum thread: ${res?.reason}`;
    }
    return safeIReply(interaction, { content: `✅ Extras saved.${republishNote}`, flags: 64 });
  }

  // --- TICKETS: modal submit -> create ticket channel ---
  if (interaction.isModalSubmit() && interaction.customId.startsWith("tk_modal:")) {
    await interaction.deferReply({ flags: 64 });
    const parts = interaction.customId.split(":");
    const panelId = parts[1];
    const buttonKey = parts[2];
    const panel = await store.getTicketPanel(panelId);

    // Load btnCfg from DB panel (covers all panels stored in data.json)
    let btnCfg = null;
    if (panel) {
      const flat = Array.isArray(panel.components) ? panel.components.flat() : [];
      btnCfg = flat.find(c => c.type === 'button' && c.key === buttonKey);
    }
    // Remap old-server categoryId to new-server category from DB config
    if (btnCfg?.categoryId) {
      const remapped = await resolvePanelCategory(interaction.guildId, panelId);
      if (remapped) btnCfg = { ...btnCfg, categoryId: remapped };
    }
    if (!btnCfg) return interaction.editReply("Ticket type not found.");
    const answers = {};
    for (const q of (btnCfg.questions || []).slice(0,5)) {
      const v = interaction.fields.getTextInputValue(q.id);
      answers[q.id] = v;
    }
    try {
      const isPublishSchem = buttonKey === 'publish_schematic';
      const ch = await createTicketChannel({
        interaction, panelId, buttonKey, btnCfg, answers,
        // For schematic tickets, the draft preview embed is the pinned anchor;
        // skip pinning the welcome+controls message.
        skipPinControl: isPublishSchem,
      });

      // Publish-schematic tickets get an extra welcome message inviting the
      // user to start the submission flow.
      if (isPublishSchem && ch) {
        try {
          const subId = ch.id; // 1-to-1 mapping: submission id == ticket channel id
          await store.setSchematicSubmission(subId, {
            id: subId,
            ticketChannelId: ch.id,
            guildId: ch.guildId,
            submitterId: interaction.user.id,
            status: 'DRAFT',
            name: null,
            designers: null,
            credits: null,
            rates: null,
            consumes: null,
            positives: null,
            negatives: null,
            build: null,
            howto: null,
            litematicUrl: null,
            litematicName: null,
            renderUrl: null,
            renderMessageId: null,
            draftMessageId: null,
            forumThreadId: null,
            forumStarterMessageId: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          const startEmbed = new EmbedBuilder()
            .setColor(0x08a4a7)
            .setTitle('Ready to submit your schematic?')
            .setDescription([
              'Click **Start Submission** to fill in the basics (name, designers, rates, build instructions, how to use).',
              '',
              'Then drop your `.litematic` file in this channel — the bot will render it automatically.',
              '',
              'A schematic manager will review and publish your post to the forum.',
              '',
              `**Already have a schematic published?** Go to your post in <#${SCHEMATIC_FORUM_CHANNEL_ID}> and click the **✏️ Edit** button on it instead of opening this ticket.`,
            ].join('\n'));
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`publish_start:${subId}`).setLabel('Start Submission').setStyle(ButtonStyle.Primary).setEmoji('📦'),
          );
          await ch.send({ embeds: [startEmbed], components: [row] }).catch(() => {});
        } catch (e) {
          console.error('[publish_schematic] welcome error:', e?.message);
        }
      }

      const visible = !!(ch && ch.permissionsFor?.(interaction.user)?.has?.(PermissionsBitField.Flags.ViewChannel));
      return safeIReply(interaction, { content: visible && ch ? `✅ Ticket created: <#${ch.id}>` : '✅ Ticket created.', flags: 64 });
    } catch (e) {
      console.error('ticket create error:', e);
      return safeIReply(interaction, { content: '❌ Failed to create ticket.', flags: 64 });
    }
  }

  // --- TICKETS: close reason modal ---
  
  // ─── CATALOG MULTIPLIER MODAL ─────────────────────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId === 'catmultmodal') {
    await interaction.deferUpdate().catch(() => {});
    const _mult = parseFloat(interaction.fields.getTextInputValue('mult'));
    if (!_mult || _mult <= 0 || _mult > 10000)
      return interaction.followUp({ content: 'Invalid multiplier. Enter a positive number.', flags: 64 });
    const _nav = catalogNavCache.get(interaction.message.id);
    if (!_nav?.currentFarmId) return;
    _nav.multiplier = _mult;
    const _f = await store.getCatalogFarm(_nav.currentFarmId);
    if (!_f) return;
    const _p = await store.getCatalogPrices(interaction.guildId);
    await interaction.message.edit({ embeds: [buildKelpFarmEmbed(_f, _p, _mult)], components: buildCatalogComponents(_mult) }).catch(() => {});
    return;
  }
  // ─── END CATALOG MULTIPLIER MODAL ─────────────────────────────────────────

  if (interaction.isModalSubmit() && interaction.customId.startsWith('tk_close_reason:')) {
    const [, channelId, mode = 'direct'] = interaction.customId.split(':');
    const cfg = await store.getTicketConfig();
    const ch = await interaction.guild?.channels.fetch(channelId).catch(() => null);
    if (!interaction.guild || !ch || ch.type !== ChannelType.GuildText) {
      await interaction.reply({ content: 'Ticket channel not found.', flags: 64 }).catch(() => {});
      return;
    }

    const rec = await store.getTicketRecord(channelId).catch(() => null);
    if (!rec) {
      await interaction.reply({ content: 'Not a ticket channel.', flags: 64 }).catch(() => {});
      return;
    }

    const isStaff = isStaffMember(interaction.member, cfg);
    const hasTicketAccess = canAccessTicketChannel(ch, interaction.member);
    if (!isStaff && !hasTicketAccess && rec.creatorId !== interaction.user.id) {
      await interaction.reply({ content: 'Only people with access to this ticket can close it.', flags: 64 }).catch(() => {});
      return;
    }

    const closeGate = await canCloseTicket(ch.id);
    if (!closeGate.ok) {
      await interaction.reply({ content: closeGate.reason, flags: 64 }).catch(() => {});
      return;
    }

    const reason = (interaction.fields.getTextInputValue('reason') || '').trim().slice(0, 1024);
    if (mode === 'requestconfirm') {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription('Closing ticket…')], flags: 64 }).catch(() => {});
      setImmediate(() => closeTicket({ guild: interaction.guild, channel: ch, closerId: interaction.user.id, reason: reason || 'Requested close' }).catch(() => {}));
      return;
    }
    if (mode === 'request') {
      const reqId = `${channelId}:${Date.now()}:${interaction.user.id}`;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`tk_reqclose_cancel:${reqId}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`tk_reqclose_accept:${reqId}`).setLabel('Close').setStyle(ButtonStyle.Danger),
      );
      const closeReqEmbed = new EmbedBuilder()
        .setColor(0x08a4a7)
        .setDescription(`<@${interaction.user.id}> requested to close this ticket.

Only the ticket creator can continue.`);
      await interaction.reply({
        content: rec?.creatorId ? `<@${rec.creatorId}>` : '',
        allowedMentions: rec?.creatorId ? { users: [rec.creatorId] } : { parse: [] },
        embeds: [closeReqEmbed],
        components: [row],
      }).catch(() => {});
      return;
    }
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription('Closing ticket…')], flags: 64 }).catch(() => {});
    setImmediate(() => closeTicket({ guild: interaction.guild, channel: ch, closerId: interaction.user.id, reason: reason || 'No reason provided' }).catch(() => {}));
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith("tk_modal_dd:")) {
    await interaction.deferReply({ flags: 64 });
    const parts = interaction.customId.split(":");
    const panelId = parts[1];
    const optKey = parts[2];
    const dp = await store.getDropdownPanel(panelId);
    const opt = dp?.options?.[optKey];
    const tsPanel = await store.getTicketPanel("building_services");
    const flat = Array.isArray(tsPanel?.components) ? tsPanel.components.flat() : [];
    const ddComp = flat.find(c => c.type === "dropdown" && c.dropdownId === "farms");
    const buyCfg = ddComp?.buyButton;
    if (!opt || !buyCfg) return interaction.editReply("Missing dropdown option/config.");
    const answers = {};
    for (const q of (buyCfg.questions || []).slice(0,5)) {
      const v = interaction.fields.getTextInputValue(q.id);
      answers[q.id] = v;
    }
    const btnCfg = { ...buyCfg, key: "build_service", label: "Building Service" };
    const selection = opt?.label ? `**${opt.label}**` : `Option: ${optKey}`;
    try {
      const ch = await createTicketChannel({ interaction, panelId: "building_services", buttonKey: "farms", btnCfg, answers, extraTopLine: selection });
      const visible = !!(ch && ch.permissionsFor?.(interaction.user)?.has?.(PermissionsBitField.Flags.ViewChannel));
      return safeIReply(interaction, { content: visible && ch ? `✅ Ticket created: <#${ch.id}>` : '✅ Ticket created.', flags: 64 });
    } catch (e) {
      console.error('dropdown ticket create error:', e);
      return safeIReply(interaction, { content: '❌ Failed to create ticket.', flags: 64 });
    }
  }

  // --- TICKETS: claim/unclaim/close buttons ---
  if (interaction.isButton() && ["tk_claim","tk_unclaim","tk_close"].includes(interaction.customId)) {
    const channel = interaction.channel;
    if (!interaction.guild || !channel || channel.type !== ChannelType.GuildText) return;
    const cfg = await store.getTicketConfig();
    // Always read the freshest record (claim/unclaim can be spammed / repeated)
    const rec = await getOrBootstrapTicketRecord(channel.id, channel);
    if (!rec) return interaction.reply({ content: "Not a ticket channel.", flags: 64 });
    const member = interaction.member;
    const isStaff = isStaffMember(member, cfg);
    const spawnerOpsBtn = hasSpawnerTicketAccess(member) && isSpawnerTicketChannel(channel);
    if (!isStaff && !spawnerOpsBtn && interaction.customId !== "tk_close") return interaction.reply({ content: "Staff only.", flags: 64 });

    if (interaction.customId === "tk_claim") {
      // Source of truth: ticket record.
      if (rec.claimedById) {
        try { if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate(); } catch {}
        // Keep controls synced even if the button is stale.
        await syncTicketChannelName(channel, rec).catch(() => {});
        await safeUpdateTicketControls(channel, rec.claimedById, rec).catch(() => {});
        try { await interaction.message.edit({ components: [ticketControlRow(rec.claimedById)] }); } catch {}
        return;
      }

      // ACK FAST (component)
      try { if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate(); } catch {}

      const now = Date.now();
      const claimerId = String(interaction.user.id).trim();
      const claimerUsername = interaction.user.username;

      // Persist first; also pin the control message id to THIS message so future edits are deterministic.
      await store.updateTicketRecord(channel.id, { claimedById: claimerId, claimedAt: now, claimerUsername, controlMessageId: interaction.message?.id || rec.controlMessageId }).catch(() => {});
      await store.recordTicketClaimed(channel.guild?.id || interaction.guildId, claimerId).catch(() => {});
      const effective = (await store.getTicketRecord(channel.id).catch(() => null)) || { ...(rec || {}), claimedById: claimerId, claimedAt: now, claimerUsername, controlMessageId: interaction.message?.id || rec.controlMessageId };

      // Public claim message (send immediately; independent of rename success)
      await channel.send({
        embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription(`<@${claimerId}> claimed this ticket.`)]
      }).catch(() => {});
      if (effective.creatorId) {
        await sendTicketQueueDm(effective.creatorId, buildTicketDmEmbed({
          title: 'Ticket Claimed',
          description: `Your ticket **${effective.label || channel.name}** was claimed by <@${claimerId}>.`,
          channelId: channel.id,
          extraFields: [{ name: `${TICKET_UI.claimedBy} Claimed By`, value: `<@${claimerId}>`, inline: true }],
        }));
      }

      // Flip emoji + buttons (edit the message the user clicked)
      await syncTicketChannelName(channel, effective).catch(() => {});
      await safeUpdateTicketControls(channel, claimerId, effective).catch(() => {});
      try { await interaction.message.edit({ components: [ticketControlRow(claimerId)] }); } catch {}

      return;
    }
    if (interaction.customId === "tk_unclaim") {
      // Source of truth: ticket record. If button is stale, repair it.
      if (!rec.claimedById) {
        try { if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate(); } catch {}
        try { await interaction.message.edit({ components: [ticketControlRow(null)] }); } catch {}
        await syncTicketChannelName(channel, { ...(rec||{}), claimedById: null }).catch(() => {});
        return;
      }

      const claimedBy = String(rec.claimedById).trim();
      const actor = String(interaction.user.id).trim();
      if (claimedBy !== actor && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        try { if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate(); } catch {}
        // Repair controls on THIS message
        try { await interaction.message.edit({ components: [ticketControlRow(claimedBy)] }); } catch {}
        return;
      }

      // ACK FAST
      try { if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate(); } catch {}

      await store.updateTicketRecord(channel.id, { claimedById: null, claimedAt: null, controlMessageId: interaction.message?.id || rec.controlMessageId }).catch(() => {});
      const effective = (await store.getTicketRecord(channel.id).catch(() => null)) || { ...(rec || {}), claimedById: null, claimedAt: null, controlMessageId: interaction.message?.id || rec.controlMessageId };
      if (rec.creatorId) {
        await sendTicketQueueDm(rec.creatorId, buildTicketDmEmbed({
          title: 'Ticket Returned',
          description: `Your ticket **${rec.label || channel.name}** is back in the queue.`,
          channelId: channel.id,
        }));
      }

      await channel.send({
        embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription(`<@${actor}> unclaimed this ticket.`)]
      }).catch(() => {});

      await syncTicketChannelName(channel, effective).catch(() => {});
      await safeUpdateTicketControls(channel, null, effective).catch(() => {});
      try { await interaction.message.edit({ components: [ticketControlRow(null)] }); } catch {}
      return;
    }
    if (interaction.customId === "tk_close") {
      // allow creator, staff, or anyone who currently has ticket access to close
      const hasTicketAccess = canAccessTicketChannel(channel, member);
      if (!isStaff && !isBuilderMember(member) && !hasTicketAccess && rec.creatorId !== interaction.user.id) {
        return interaction.reply({ content: "Only people with access to this ticket can close it.", flags: 64 });
      }

      const closeGate = await canCloseTicket(channel.id);
      if (!closeGate.ok) {
        return interaction.reply({ content: closeGate.reason, flags: 64 });
      }

      const modal = new ModalBuilder()
        .setCustomId(`tk_close_reason:${channel.id}`)
        .setTitle('Close Ticket');
      const input = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Reason for closing')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1024);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal).catch(() => {});
      return;
    }
  }

  
  // tklog_transcript / tklog_details buttons removed — transcripts are now attached
  // directly to the close log embed and no longer stored on disk.


  // --- APPLICATIONS: DM confirmation buttons ---
  if (interaction.isButton() && interaction.customId.startsWith("app_dm_confirm:")) {
    const parts = interaction.customId.split(":");
    const action = parts[1];
    const typeId = parts[2];
    const guildIdFromBtn = parts[3] || null;
    const sess = appSessions.get(interaction.user.id);

    if (action === "cancel") {
      appSessions.delete(interaction.user.id);
      await interaction.update({
        components: [],
        embeds: [new EmbedBuilder().setColor(0x2b2d31).setTitle("Application canceled").setDescription("Your application has been canceled.")]
      }).catch(() => {});
      return;
    }

    if (action === "start") {
      const type = await store.getAppType(typeId).catch(() => null);
      const cooldown = await getApplicationCooldown(interaction.user.id, typeId);
      if (cooldown.blocked) {
        await interaction.update({
          components: [],
          embeds: [applicationCooldownEmbed(type?.title || typeId, cooldown)]
        }).catch(() => {});
        appSessions.delete(interaction.user.id);
        return;
      }
      // ensure session exists
      if (!sess || sess.typeId !== typeId) {
        const cfgNow = await store.getTicketConfig().catch(() => ({}));
        appSessions.set(interaction.user.id, {
          typeId,
          guildId: guildIdFromBtn || interaction.guildId || sess?.guildId,
          reviewChannelId: cfgNow.applicationsReviewChannelId || null,
          dmChannelId: interaction.channelId,
          answers: {},
          qIndex: 0,
          awaiting: false,
          expiresAt: Date.now() + 3 * 60 * 60 * 1000
        });
      } else if (!sess.guildId && guildIdFromBtn) {
        sess.guildId = guildIdFromBtn;
        appSessions.set(interaction.user.id, sess);
      }
      await interaction.update({
        components: [],
        embeds: [new EmbedBuilder().setColor(Colors.Green).setTitle("Application Started").setDescription("Please answer the questions below, either by clicking on the dropdown menus or sending a message to the bot.")]
      }).catch(() => {});
      await sendNextAppQuestion(interaction.user.id);
      return;
    }
  }

// --- APPLICATIONS: accept/deny ---
  if (interaction.isButton() && interaction.customId.startsWith("app_decide:")) {
    const parts = interaction.customId.split(":");
    const action = parts[1];
    const appId = parts[2];
    const sub = await store.getAppSubmission(appId);
    if (!sub) return interaction.reply({ content: "Application not found.", flags: 64 });
    const cfg = await store.getTicketConfig();
    const actingMember = await interaction.guild?.members.fetch(interaction.user.id).catch(() => interaction.member);
    if (!actingMember || !isStaffMember(actingMember, cfg)) return interaction.reply({ content: "Staff only.", flags: 64 });

    if (action === "accept" || action === "deny") {
      await interaction.deferUpdate().catch(() => {});
      const status = action === "accept" ? "ACCEPTED" : "DENIED";
      await store.updateAppSubmission(appId, { status, decidedById: interaction.user.id, decidedAt: Date.now() });
      const color = status === "ACCEPTED" ? Colors.Green : Colors.Red;
      const title = status === "ACCEPTED" ? "Accepted" : "Denied";
      const baseEmbed = interaction.message.embeds?.[0] ? EmbedBuilder.from(interaction.message.embeds[0]) : new EmbedBuilder();
      const baseTitle = (interaction.message.embeds[0]?.title || "Application").replace(/\s+[—-]\s+(Accepted|Denied)$/i, '').trim();
      const eb = baseEmbed.setColor(color).setTitle(`${baseTitle} - ${title}`);
      if (typeof eb.clearFooter === 'function') eb.clearFooter();
      // Preserve the View Ticket link after a decision, if a ticket was opened.
      const survivingRows = buildAppReviewActionRows({
        appId,
        ticketChannelId: sub.ticketChannelId || null,
        guildId: interaction.guildId,
        includeDecisionButtons: false,
      });
      await interaction.message.edit({ embeds: [eb], components: survivingRows }).catch(()=>{});
      if (status === "ACCEPTED") {
        await grantApplicationAcceptanceRoles({
          guild: interaction.guild,
          userId: sub.userId,
          typeId: sub.typeId,
          reason: `Application accepted by ${interaction.user.tag}`,
        }).catch(e => console.error('Application role grant error:', e?.message || e));
      }
      const user = await interaction.client.users.fetch(sub.userId).catch(()=>null);
      if (user) {
        const dm = await user.createDM().catch(()=>null);
        if (dm) {
          const appType = await store.getAppType(sub.typeId).catch(() => null);
          const typeName = appType?.title || sub.typeId;
          const accepted = status === "ACCEPTED";
          const dmEmbed = new EmbedBuilder()
            .setColor(accepted ? Colors.Green : Colors.Red)
            .setTitle(accepted ? "Application accepted" : "Application denied")
            .setDescription(
              `Your application for **${typeName}** has been ${accepted ? "accepted" : "denied"} by ${interaction.user}.`
            );
          await dm.send({ embeds: [dmEmbed] }).catch(()=>{});
          if (accepted) await startAcceptedStaffInfoFlow({ user, submission: sub, acceptedById: interaction.user.id, dm }).catch(() => {});
        }
      }
      return;
    }
    // reason modals
    if (action === "accept_reason" || action === "deny_reason") {
      const modal = new ModalBuilder().setCustomId(`app_reason:${action}:${appId}`).setTitle("Decision Reason");
      modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("reason").setLabel("Reason").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)));
      await interaction.showModal(modal);
      return;
    }
  }

  if (interaction.isButton() && interaction.customId.startsWith("app_open_ticket:")) {
    const appId = interaction.customId.split(":")[1];
    const sub = await store.getAppSubmission(appId);
    if (!sub) return interaction.reply({ content: "Application not found.", flags: 64 });
    const cfg = await store.getTicketConfig();
    const actingMember = await interaction.guild?.members.fetch(interaction.user.id).catch(() => interaction.member);
    if (!actingMember || !isStaffMember(actingMember, cfg)) return interaction.reply({ content: "Staff only.", flags: 64 });
    const targetUser = await interaction.client.users.fetch(sub.userId).catch(() => null);
    if (!targetUser) return interaction.reply({ content: "Applicant not found.", flags: 64 });
    await interaction.deferReply({ flags: 64 }).catch(() => {});
    try {
      const sourceLink = `https://discord.com/channels/${interaction.guildId}/${sub.reviewChannelId || interaction.channelId}/${sub.reviewMessageId || interaction.message?.id}`;
      const supportQuestion = `Application Request
${sourceLink}`;
      const result = await createSupportTicketForUser({ interaction, targetUser, supportQuestion });
      const ticketChannelId = result?.channel?.id || null;

      // Persist the linked ticket channel on the submission so the review
      // embed survives bot restarts and an Accept/Deny later keeps the link.
      if (ticketChannelId) {
        await store.updateAppSubmission(appId, { ticketChannelId }).catch(() => {});
        try {
          const stillPending = String(sub.status || 'PENDING').toUpperCase() === 'PENDING';
          const newRows = buildAppReviewActionRows({
            appId,
            ticketChannelId,
            guildId: interaction.guildId,
            includeDecisionButtons: stillPending,
          });
          await interaction.message.edit({ components: newRows }).catch(() => {});
        } catch (e) {
          console.error('[app_open_ticket] review-row edit error:', e?.message);
        }
      }

      if (result?.duplicate) {
        await interaction.editReply({ content: `A support ticket is already open for this applicant: <#${ticketChannelId}>` }).catch(() => {});
      } else {
        await interaction.editReply({ content: `✅ Support ticket created: <#${ticketChannelId}>` }).catch(() => {});
      }
    } catch (e) {
      await interaction.editReply({ content: e?.message || 'Could not create the support ticket.' }).catch(() => {});
    }
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith("app_reason:")) {
    await interaction.deferReply({ flags: 64 });
    const cfg = await store.getTicketConfig();
    const actingMember = await interaction.guild?.members.fetch(interaction.user.id).catch(() => interaction.member);
    if (!actingMember || !isStaffMember(actingMember, cfg)) return safeIReply(interaction, { content: 'Staff only.', flags: 64 });
    const parts = interaction.customId.split(":");
    const action = parts[1];
    const appId = parts[2];
    const reason = interaction.fields.getTextInputValue("reason");
    const sub = await store.getAppSubmission(appId);
    if (!sub) return interaction.editReply("Application not found.");
    const status = action.startsWith("accept") ? "ACCEPTED" : "DENIED";
    await store.updateAppSubmission(appId, { status, decidedById: interaction.user.id, decidedAt: Date.now(), reason });
    // edit review message
    try {
      const ch = await interaction.guild.channels.fetch(sub.reviewChannelId).catch(()=>null);
      const msg = ch ? await ch.messages.fetch(sub.reviewMessageId).catch(()=>null) : null;
      if (msg) {
        const color = status === "ACCEPTED" ? Colors.Green : Colors.Red;
        const title = status === "ACCEPTED" ? "Accepted" : "Denied";
        const baseTitle = (msg.embeds[0]?.title || "Application").replace(/\s+[—-]\s+(Accepted|Denied)$/i, '').trim();
        const eb = EmbedBuilder.from(msg.embeds[0]).setColor(color).setTitle(`${baseTitle} - ${title}`).addFields({ name: "Reason", value: formatApplicationReason(reason) });
        if (typeof eb.clearFooter === 'function') eb.clearFooter();
        const survivingRows = buildAppReviewActionRows({
          appId,
          ticketChannelId: sub.ticketChannelId || null,
          guildId: interaction.guildId,
          includeDecisionButtons: false,
        });
        await msg.edit({ embeds: [eb], components: survivingRows }).catch(()=>{});
      }
    } catch {}
    if (status === "ACCEPTED") {
      await grantApplicationAcceptanceRoles({
        guild: interaction.guild,
        userId: sub.userId,
        typeId: sub.typeId,
        reason: `Application accepted by ${interaction.user.tag}`,
      }).catch(e => console.error('Application role grant error:', e?.message || e));
    }
    const user = await interaction.client.users.fetch(sub.userId).catch(()=>null);
    if (user) {
      const dm = await user.createDM().catch(()=>null);
      if (dm) {
        const appType = await store.getAppType(sub.typeId).catch(() => null);
        const typeName = appType?.title || sub.typeId;
        const accepted = status === "ACCEPTED";
        const dmEmbed = new EmbedBuilder()
          .setColor(accepted ? Colors.Green : Colors.Red)
          .setTitle(accepted ? "Application accepted" : "Application denied")
          .setDescription(
            `Your application for **${typeName}** has been ${accepted ? "accepted" : "denied"} by ${interaction.user}.`
          )
          .addFields({ name: "Reason", value: formatApplicationReason(reason) });
        await dm.send({ embeds: [dmEmbed] }).catch(()=>{});
        if (accepted) await startAcceptedStaffInfoFlow({ user, submission: sub, acceptedById: interaction.user.id, dm }).catch(() => {});
      }
    }
    return interaction.editReply("Decision sent.");
  }

  // --- TICKETS: request close command buttons ---
  if (interaction.isButton() && interaction.customId.startsWith("tk_reqclose_accept:")) {
    const channel = interaction.channel;
    const rec = await store.getTicketRecord(channel.id);
    if (!rec) return interaction.reply({ content: "Not a ticket.", flags: 64 });
    if (interaction.user.id !== rec.creatorId) return interaction.reply({ content: "Only the ticket creator can continue.", flags: 64 });

    const closeGate = await canCloseTicket(channel.id);
    if (!closeGate.ok) {
      return interaction.reply({ content: closeGate.reason, flags: 64 });
    }

    const modal = new ModalBuilder()
      .setCustomId(`tk_close_reason:${channel.id}:requestconfirm`)
      .setTitle('Close Ticket');
    const input = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('Reason for closing')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(1024);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal).catch(() => interaction.reply({ content: 'Could not open the close form.', flags: 64 }).catch(() => {}));
  }

  if (interaction.isButton() && interaction.customId.startsWith("tk_reqclose_cancel:")) {
    const channel = interaction.channel;
    const rec = await store.getTicketRecord(channel.id);
    if (!rec) return interaction.reply({ content: "Not a ticket.", flags: 64 });
    if (interaction.user.id !== rec.creatorId) return interaction.reply({ content: "Only the ticket creator can cancel the close request.", flags: 64 });

    await interaction.update({
      embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription("Close request canceled. Ticket will remain open.")],
      components: []
    }).catch(() => {});
    return;
  }


  // --- SCHEMATIC PURCHASE PANEL ---


  if (interaction.isModalSubmit() && interaction.customId === 'sticky_create_modal') {
    await interaction.deferReply({ flags: 64 });
    const content = interaction.fields.getTextInputValue('sticky_content');
    const title = interaction.fields.getTextInputValue('sticky_embed_title');
    const desc = interaction.fields.getTextInputValue('sticky_embed_desc');
    const colorInput = interaction.fields.getTextInputValue('sticky_embed_color');
    let embedData = null;
    if (title || desc || colorInput) { embedData = { title: title || null, description: desc || null, color: colorInput || '#2b2d31' }; try { resolveColor(embedData.color); } catch { embedData.color = '#2b2d31'; } }
    if (!content && !embedData) return interaction.editReply('❌ You must provide at least Message Content OR Embed details.');
    await store.addSticky(interaction.channelId, { content: content || null, embed: embedData });
    await interaction.editReply('✅ Sticky message created!'); return;
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('sticky_edit_modal:')) {
    await interaction.deferReply({ flags: 64 });
    const stickyId = interaction.customId.split(':')[1];

    const content = interaction.fields.getTextInputValue('sticky_content');
    const title = interaction.fields.getTextInputValue('sticky_embed_title');
    const desc = interaction.fields.getTextInputValue('sticky_embed_desc');
    const colorInput = interaction.fields.getTextInputValue('sticky_embed_color');

    let embedData = null;
    if (title || desc || colorInput) {
      embedData = { title: title || null, description: desc || null, color: colorInput || '#2b2d31' };
      try { resolveColor(embedData.color); } catch { embedData.color = '#2b2d31'; }
    }
    if (!content && !embedData) return interaction.editReply('❌ You must provide at least Message Content OR Embed details.');

    const ok = await store.updateSticky(stickyId, { content: content || null, embed: embedData });
    if (!ok) return interaction.editReply('❌ Sticky not found (it may have been deleted).');

    // Best-effort: edit the current sticky message in-channel if it exists
    try {
      const sticky = await store.getStickyById(stickyId);
      if (sticky?.channelId && sticky?.lastMessageId) {
        const ch = await interaction.client.channels.fetch(sticky.channelId).catch(() => null);
        const msg = ch ? await ch.messages.fetch(sticky.lastMessageId).catch(() => null) : null;
        if (msg) {
          const embeds = [];
          if (embedData && (embedData.title || embedData.description)) {
            const eb = new EmbedBuilder().setColor(embedData.color);
            if (embedData.title) eb.setTitle(embedData.title);
            if (embedData.description) eb.setDescription(embedData.description);
            embeds.push(eb);
          }
          await msg.edit({ content: content || null, embeds });
        }
      }
    } catch {}

    await interaction.editReply('✅ Sticky updated.');
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('edit_embed_modal:')) {
    await interaction.deferReply({ flags: 64 });
    const parts = interaction.customId.split(':');
    const channelId = parts[1];
    const messageId = parts[2];

    const content = interaction.fields.getTextInputValue('edit_embed_content');
    const title = interaction.fields.getTextInputValue('edit_embed_title');
    const desc = interaction.fields.getTextInputValue('edit_embed_desc');
    const colorInput = interaction.fields.getTextInputValue('edit_embed_color');

    let embeds = [];
    if (title || desc || colorInput) {
      let c = colorInput || '#2b2d31';
      try { resolveColor(c); } catch { c = '#2b2d31'; }
      embeds = [new EmbedBuilder().setTitle(title || null).setDescription(desc || null).setColor(c)];
    }

    const ch = await interaction.client.channels.fetch(channelId).catch(() => null);
    if (!ch) return interaction.editReply('❌ Channel not found.');
    const msg = await ch.messages.fetch(messageId).catch(() => null);
    if (!msg) return interaction.editReply('❌ Message not found.');

    await msg.edit({ content: content || '', embeds });
    await interaction.editReply('✅ Message updated.');
    return;
  }


  // --- DROPDOWN option modal submit ---
  
  // --- STAFF PAY: IGN modal submit → start paywatch ---

if (interaction.isButton()) {

    if (interaction.customId === 'giveaway_join') {
      await interaction.deferReply({ flags: 64 }).catch(() => {});
      const g = await store.getGiveaway(interaction.message.id).catch(() => null);
      if (!g) return interaction.editReply({ content: 'This giveaway could not be found.' }).catch(() => {});
      if (g.ended) return interaction.editReply({ content: 'This giveaway has already ended.' }).catch(() => {});

      const added = await store.addGiveawayEntry(g.id, interaction.user.id).catch(() => false);
      if (!added) {
        return interaction.editReply({ content: 'You are already entered in this giveaway.' }).catch(() => {});
      }

      const updated = await store.getGiveaway(interaction.message.id).catch(() => null);
      const entryCount = updated?.entries?.length || 0;
      const originalEmbed = interaction.message.embeds?.[0];
      if (originalEmbed) {
        const base = EmbedBuilder.from(originalEmbed);
        let desc = base.data?.description || '';
        if (/^Entries:\s*\*\*\d+\*\*/im.test(desc)) {
          desc = desc.replace(/^Entries:\s*\*\*\d+\*\*/gim, `Entries: **${entryCount}**`);
        } else if (/^Entries:\s*\d+/im.test(desc)) {
          desc = desc.replace(/^Entries:\s*\d+/gim, `Entries: **${entryCount}**`);
        } else {
          desc = `${desc.trim()}
Entries: **${entryCount}**`.trim();
        }
        await interaction.message.edit({ embeds: [base.setDescription(desc)] }).catch(() => {});
      }

      await interaction.editReply({ content: 'You joined the giveaway.' }).catch(() => {});
      return;
    }

    if (interaction.customId.startsWith('build_done:')) {
      const buildId = interaction.customId.split(':')[1];
      const job = await store.getBuildJob(buildId);
      if (!job) return interaction.reply({ content: 'Build not found.', flags: 64 });
      if (job.status !== 'PENDING') return interaction.reply({ content: 'Build is not in progress.', flags: 64 });

      // Only the claimer/builder (or admin) can mark done
      const isAdmin = interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator);
      if (job.builderDiscordId && interaction.user.id !== job.builderDiscordId && !isAdmin) {
        return interaction.reply({ content: 'Only the assigned builder can mark this done.', flags: 64 });
      }

      await interaction.deferUpdate().catch(() => {});
      const doneAt = Date.now();

      const orangeEmbed = buildTrackingEmbed(job, 'AWAITING_CONFIRM', { timestamp: doneAt });
      await interaction.message.edit({ embeds: [orangeEmbed], components: [] }).catch(() => {});
      await store.updateBuildJob(buildId, { status: 'AWAITING_CONFIRM', doneAt, doneBy: interaction.user.id, buildMessageId: interaction.message.id, buildChannelId: interaction.message.channelId });

      // DM the customer with Yes/No
      if (job.customerDiscordId) {
        try {
          const customer = await client.users.fetch(job.customerDiscordId).catch(() => null);
          if (customer) {
            const yesBtn = new ButtonBuilder().setCustomId(`build_confirm_yes:${buildId}`).setLabel('✅ Yes, I received it').setStyle(ButtonStyle.Success);
            const noBtn  = new ButtonBuilder().setCustomId(`build_confirm_no:${buildId}`).setLabel('❌ No, I did not').setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder().addComponents(yesBtn, noBtn);
            const dmEmbed = new EmbedBuilder()
              .setColor(0xFF8C00)
              .setTitle('Did you receive your build?')
              .setDescription(`**${job.buildType || 'Build'}** from \`${job.builderIgn}\`\n\nDid you receive what you ordered?`)
              .setFooter({ text: `Build ID: ${buildId}` });
            await customer.send({ embeds: [dmEmbed], components: [row] }).catch(() => {});
          }
        } catch {}
      }
      return;
    }

    // --- BUILD: customer confirms YES (received farm) ---
    if (interaction.customId.startsWith('build_confirm_yes:')) {
      const buildId = interaction.customId.split(':')[1];
      const job = await store.getBuildJob(buildId);
      if (!job) return interaction.reply({ content: 'Build not found.', flags: 64 });
      if (job.status !== 'AWAITING_CONFIRM') return interaction.reply({ content: 'This confirmation has already been handled.', flags: 64 });
      if (interaction.user.id !== job.customerDiscordId) return interaction.reply({ content: 'Only the customer can confirm this.', flags: 64 });

      await interaction.deferUpdate().catch(() => {});
      const confirmedAt = Date.now();

      // Compute tax rate based on builder's current roles
      const taxRate = await getBuilderTaxRate(interaction.guild, job.builderDiscordId);
      await store.updateBuildJob(buildId, { status: 'AWAITING_PAYOUT', confirmedAt, taxRate });

      // Pay button — no emoji per requirement
      const payBtn = new ButtonBuilder().setCustomId(`build_admin_pay:${buildId}`).setLabel('Pay Builder').setStyle(ButtonStyle.Success);
      const row = new ActionRowBuilder().addComponents(payBtn);

      const updatedJob = { ...job, price: job.price, taxRate };
      const greenEmbed = buildTrackingEmbed(updatedJob, 'AWAITING_PAYOUT', { timestamp: confirmedAt });

      if (job.buildMessageId && job.buildChannelId) {
        const buildCh = await client.channels.fetch(job.buildChannelId).catch(() => null);
        if (buildCh) {
          const buildMsg = await buildCh.messages.fetch(job.buildMessageId).catch(() => null);
          if (buildMsg) await buildMsg.edit({ embeds: [greenEmbed], components: [row] }).catch(() => {});
        }
      }

      // Update ticket channel name → 🟢 builder-amount
      if (job.ticketChannelId) {
        const ticketCh = await client.channels.fetch(job.ticketChannelId).catch(() => null);
        const ticketRec = ticketCh ? await store.getTicketRecord(job.ticketChannelId).catch(() => null) : null;
        if (ticketCh && ticketRec) {
          // Fetch builder username for rename (builder may differ from claimer if reassigned)
          const _builderMember = job.builderDiscordId
            ? await (interaction.guild || client.guilds.cache.first())?.members.fetch(job.builderDiscordId).catch(() => null) : null;
          const _builderSlug = _builderMember?.user?.username || ticketRec.claimerUsername || 'builder';
          await store.updateTicketRecord(job.ticketChannelId, {
            ticketType: 'done', buildAmount: job.price, claimerUsername: _builderSlug
          }).catch(() => {});
          const updatedRec = await store.getTicketRecord(job.ticketChannelId).catch(() => ({ ...ticketRec, ticketType: 'done', buildAmount: job.price, claimerUsername: _builderSlug }));
          await syncTicketChannelName(ticketCh, updatedRec).catch(() => {});
        }
      }

      await interaction.message.edit({ embeds: [new EmbedBuilder().setColor(Colors.Green).setTitle('Confirmed').setDescription('Thank you! Payment for the builder is being processed.')], components: [] }).catch(() => {});
      return;
    }

    // --- BUILD: customer confirms NO (did not receive) ---
    if (interaction.customId.startsWith('build_confirm_no:')) {
      const buildId = interaction.customId.split(':')[1];
      const job = await store.getBuildJob(buildId);
      if (!job) return interaction.reply({ content: 'Build not found.', flags: 64 });
      if (job.status !== 'AWAITING_CONFIRM') return interaction.reply({ content: 'This confirmation has already been handled.', flags: 64 });
      if (interaction.user.id !== job.customerDiscordId) return interaction.reply({ content: 'Only the customer can respond to this.', flags: 64 });

      await interaction.deferUpdate().catch(() => {});
      await store.updateBuildJob(buildId, { status: 'PENDING', doneAt: null, doneBy: null });

      // Revert tracking embed to YELLOW (building again)
      const cancelBtn = new ButtonBuilder().setCustomId(`build_cancel:${buildId}`).setLabel('Cancel Build').setStyle(ButtonStyle.Danger);
      const doneBtn = new ButtonBuilder().setCustomId(`build_done:${buildId}`).setLabel('Mark Done').setStyle(ButtonStyle.Success);
      const row = new ActionRowBuilder().addComponents(doneBtn, cancelBtn);
      const yellowEmbed = buildTrackingEmbed(job, 'PENDING', { dispute: true });

      if (job.buildMessageId && job.buildChannelId) {
        const buildCh = await client.channels.fetch(job.buildChannelId).catch(() => null);
        if (buildCh) {
          const buildMsg = await buildCh.messages.fetch(job.buildMessageId).catch(() => null);
          if (buildMsg) await buildMsg.edit({ embeds: [yellowEmbed], components: [row] }).catch(() => {});
        }
      }
      await interaction.message.edit({ embeds: [new EmbedBuilder().setColor(Colors.Red).setTitle('Response Recorded').setDescription('Your response has been sent to the team. Please contact staff in your ticket.')], components: [] }).catch(() => {});
      return;
    }

    // --- BUILD: admin initiates builder payout ---
    if (interaction.customId.startsWith('build_admin_pay:')) {
      const buildId = interaction.customId.split(':')[1];
      const job = await store.getBuildJob(buildId);
      if (!job) return interaction.reply({ content: 'Build not found.', flags: 64 });
      if (job.status !== 'AWAITING_PAYOUT') return interaction.reply({ content: 'Build is not awaiting payout.', flags: 64 });
      if (!interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: 'Admins only.', flags: 64 });
      }

      await interaction.deferUpdate().catch(() => {});

      // Use stored tax rate, fall back to re-computing if missing
      const taxRate = job.taxRate || await getBuilderTaxRate(interaction.guild, job.builderDiscordId);
      const builderPay = Math.floor(job.price * taxRate);

      if (!DONUTSMP_API_KEY) {
        return interaction.followUp({ content: '❌ DONUTSMP_API_KEY missing.', flags: 64 });
      }

      let payerStart = null, receiverStart = null;
      try {
        payerStart = await getUserBalance({ baseUrl: DONUTSMP_BASE_URL, pathTemplate: DONUTSMP_STATS_PATH, apiKey: DONUTSMP_API_KEY, user: job.receiverIgn, balancePath: DONUTSMP_BALANCE_PATH });
        receiverStart = await getUserBalance({ baseUrl: DONUTSMP_BASE_URL, pathTemplate: DONUTSMP_STATS_PATH, apiKey: DONUTSMP_API_KEY, user: job.builderIgn, balancePath: DONUTSMP_BALANCE_PATH });
      } catch {}

      const watchId = generateId();
      const created = Date.now();
      const expires = created + PAYWATCH_MAX_MINUTES * 60 * 1000;
      const w = await store.addWatch({
        id: watchId, status: 'WATCHING',
        guild_id: interaction.guildId,
        channel_id: C.CHANNEL_BUILD_TRACKING,
        creator_id: interaction.user.id,
        payer_discord_id: job.receiverDiscordId,
        payer_ign: job.receiverIgn,
        receiver_ign: job.builderIgn,
        amount: builderPay,
        schematic: null,
        schematic_id: null, file_path: null, note: null,
        payer_start_balance: payerStart, receiver_start_balance: receiverStart,
        payer_end_balance: payerStart, receiver_end_balance: receiverStart,
        created_at: created, expires_at: expires, last_check_at: null, message_id: null,
        buildJobId: buildId,
        buildMessageId: interaction.message.id,
        buildChannelId: interaction.message.channelId,
      });

      const trackCh = await client.channels.fetch(C.CHANNEL_BUILD_TRACKING).catch(() => null);
      if (trackCh) {
        const wMsg = await trackCh.send({ embeds: [watchEmbed(w)], components: cancelRow(watchId, true) }).catch(() => null);
        if (wMsg?.id) await store.updateWatch(watchId, { message_id: wMsg.id });
      }
      await store.updateBuildJob(buildId, { builderPaywatchId: watchId, buildMessageId: interaction.message.id, buildChannelId: interaction.message.channelId, taxRate });
      startPaywatchPolling(watchId);

      // Remove pay button from the embed while paywatch is active
      await interaction.message.edit({ components: [] }).catch(() => {});
      return;
    }

    // --- BUILD: cancel button ---
    if (interaction.customId.startsWith('build_cancel:')) {
      const buildId = interaction.customId.split(':')[1];
      const job = await store.getBuildJob(buildId);
      if (!job) return interaction.reply({ content: 'Build not found.', flags: 64 });

      const isAdmin = interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator);
      const isBuilder = job.builderDiscordId && interaction.user.id === job.builderDiscordId;
      if (!isBuilder && !isAdmin) return interaction.reply({ content: 'Only the builder or an admin can cancel.', flags: 64 });

      if (!['PENDING', 'AWAITING_CONFIRM'].includes(job.status)) {
        return interaction.reply({ content: 'Cannot cancel at this stage.', flags: 64 });
      }

      await interaction.deferUpdate().catch(() => {});
      await store.updateBuildJob(buildId, { status: 'CANCELLED', cancelledAt: Date.now(), cancelledBy: interaction.user.id });

      const cancelledEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('Build Cancelled')
        .addFields(
          { name: 'Build', value: job.buildType ? job.buildType.replace(/\b\w/g, c => c.toUpperCase()) : '—', inline: true },
          { name: 'Customer IGN', value: `\`${job.customerIgn}\``, inline: true },
          { name: 'Builder IGN', value: `\`${job.builderIgn}\``, inline: true },
          { name: 'Cancelled by', value: `<@${interaction.user.id}>`, inline: true },
        )
        .setFooter({ text: `Build ID: ${buildId}` })
        .setTimestamp();

      await interaction.message.edit({ embeds: [cancelledEmbed], components: [] }).catch(() => {});

      // Revert ticket channel name to 🟡 claimed if ticket exists
      if (job.ticketChannelId) {
        const ticketCh = await client.channels.fetch(job.ticketChannelId).catch(() => null);
        const ticketRec = ticketCh ? await store.getTicketRecord(job.ticketChannelId).catch(() => null) : null;
        if (ticketCh && ticketRec) {
          await store.updateTicketRecord(job.ticketChannelId, { ticketType: 'normal', buildFarmName: null }).catch(() => {});
          const updatedRec = await store.getTicketRecord(job.ticketChannelId).catch(() => ({ ...ticketRec, ticketType: 'normal', buildFarmName: null }));
          await syncTicketChannelName(ticketCh, updatedRec).catch(() => {});
        }
      }
      return;
    }
    if (interaction.customId.startsWith('paywatch_cancel:')) {
      const watchId = interaction.customId.split(':')[1];
      try { if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate(); } catch {}
      const watch = await store.getWatch(watchId).catch(() => null);
      if (!watch) return;
      const canCancel = interaction.user.id === String(watch.creator_id) || interaction.user.id === String(watch.payer_discord_id) || interaction.member?.permissions?.has?.(PermissionsBitField.Flags.Administrator);
      if (!canCancel) {
        return interaction.followUp({ content: 'Only the creator, customer, or an admin can cancel this paywatch.', flags: 64 }).catch(() => {});
      }
      if (watch.status !== 'WATCHING') return;
      const cancelled = await store.updateWatch(watchId, { status: 'CANCELLED', cancelled_at: Date.now(), cancelled_by: interaction.user.id }).catch(() => watch);
      await safeEditOriginal(cancelled, [canceledEmbed(cancelled)], false);
      try { await interaction.message?.edit({ embeds: [canceledEmbed(cancelled)], components: [] }); } catch {}
      stopPaywatchPolling(watchId);
      return;
    }

    if (interaction.customId.startsWith('stats_nav:')) {
      const [, kind, sessionId, dir] = interaction.customId.split(':');
      const sess = statsPanelSessions.get(sessionId);
      if (!sess) return safeComponentReply(interaction, { content: 'This stats panel expired. Run the command again.', flags: 64 }).catch(() => {});
      if (interaction.user.id !== sess.userId && !interaction.member?.permissions?.has?.(PermissionsBitField.Flags.Administrator)) {
        return safeComponentReply(interaction, { content: 'Only the command user can change pages on this panel.', flags: 64 }).catch(() => {});
      }
      const totalPages = Math.max(1, Math.ceil((sess.rows?.length || 0) / 10));
      const nextPage = Math.max(0, Math.min(totalPages - 1, (sess.page || 0) + (dir === 'next' ? 1 : -1)));
      sess.page = nextPage;
      statsPanelSessions.set(sessionId, sess);
      const embed = kind === 'builder' ? renderBuilderStatsEmbed(sess.rows || [], nextPage, totalPages) : renderStaffStatsEmbed(sess.rows || [], nextPage, totalPages);
      return interaction.update({ embeds: [embed], components: statsNavRow(kind, sessionId, nextPage, totalPages) }).catch(() => {});
    }

    if (interaction.customId.startsWith('build_remove_confirm:')) {
      const [, sessionId, buildId] = interaction.customId.split(':');
      const sess = buildRemoveSessions.get(sessionId);
      if (!sess) return safeComponentReply(interaction, { content: 'This build removal prompt expired. Run /build remove again.', flags: 64 }).catch(() => {});
      if (interaction.user.id !== sess.userId && !interaction.member?.permissions?.has?.(PermissionsBitField.Flags.Administrator)) {
        return safeComponentReply(interaction, { content: 'Only the command user can confirm this removal.', flags: 64 }).catch(() => {});
      }
      const req = await store.getBuildRequest(buildId).catch(() => null);
      if (!req) return interaction.update({ content: 'That queued build no longer exists.', embeds: [], components: [] }).catch(() => {});
      await store.deleteBuildRequest(buildId).catch(() => false);
      await buildQueue.refreshQueueBoard(interaction.guild, store).catch(() => {});
      buildRemoveSessions.delete(sessionId);
      const customer = req.userId ? await client.users.fetch(req.userId).catch(() => null) : null;
      if (customer) {
        await customer.send({ embeds: [new EmbedBuilder().setColor(0xed4245).setDescription(`Your queued build request for **${req.buildType || 'Build'}** was removed by staff.`)] }).catch(() => {});
      }
      const removedMsg = `Removed queued build **${req.buildType || 'Build'}** for \`${req.ign || 'Unknown'}\`${customer ? '\nCustomer notified via DM.' : ''}`;
      return interaction.update({ embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(removedMsg)], components: [] }).catch(() => {});
    }

    if (interaction.customId.startsWith('build_remove_cancel:')) {
      const [, sessionId] = interaction.customId.split(':');
      const sess = buildRemoveSessions.get(sessionId);
      if (!sess) return safeComponentReply(interaction, { content: 'This build removal prompt expired.', flags: 64 }).catch(() => {});
      if (interaction.user.id !== sess.userId && !interaction.member?.permissions?.has?.(PermissionsBitField.Flags.Administrator)) {
        return safeComponentReply(interaction, { content: 'Only the command user can cancel this removal.', flags: 64 }).catch(() => {});
      }
      buildRemoveSessions.delete(sessionId);
      return interaction.update({ embeds: [new EmbedBuilder().setColor(0x9b9b9b).setDescription('Build removal cancelled.')], components: [] }).catch(() => {});
    }

  } // end isButton


if (interaction.isStringSelectMenu() && interaction.customId === 'build_remove_select') {
  const buildId = interaction.values?.[0];
  const req = buildId ? await store.getBuildRequest(buildId).catch(() => null) : null;
  if (!req) {
    return interaction.update({ embeds: [new EmbedBuilder().setColor(0xed4245).setDescription('That queued build could not be found. Run /build remove again.')], components: [] }).catch(() => {});
  }
  const sessionId = generateId();
  buildRemoveSessions.set(sessionId, { userId: interaction.user.id, guildId: interaction.guildId, buildId, createdAt: Date.now() });
  const eb = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('Confirm Queued Build Removal')
    .setDescription(`Remove **${req.buildType || 'Build'}** for \`${req.ign || 'Unknown'}\` from the queue?`)
    .addFields(
      { name: `${E_RECEIVER} Customer`, value: req.userId ? `<@${req.userId}>` : '—', inline: true },
      { name: `${E_INFO} Details`, value: String(req.details || '—').slice(0, 1024), inline: false },
      { name: `${E_STATUS} Status`, value: String(req.status || 'queued'), inline: true },
    )
    .setFooter({ text: 'The customer will receive a DM if you confirm.' });
  return interaction.update({ embeds: [eb], components: buildRemoveConfirmRow(sessionId, buildId) }).catch(() => {});
}

// --- CREATE EMBED BUILDER ---
if (interaction.isStringSelectMenu() && interaction.customId === "create_embed_color") {

  const colorName = interaction.values?.[0] || "Default";
  const modal = new ModalBuilder()
    .setCustomId(`create_embed_modal:${colorName}`)
    .setTitle("Create Embed");

  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setLabel("Title")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(256);

  const descInput = new TextInputBuilder()
    .setCustomId("description")
    .setLabel("Description")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(4000);

  const imageInput = new TextInputBuilder()
    .setCustomId("image_url")
    .setLabel("Image URL (optional)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(imageInput),
  );

  return interaction.showModal(modal).catch(() => {});
}

if (interaction.isModalSubmit() && interaction.customId.startsWith("create_embed_modal:")) {
  const colorName = interaction.customId.split(":")[1] || "Default";
  const title = (interaction.fields.getTextInputValue("title") || "").trim();
  const description = (interaction.fields.getTextInputValue("description") || "").trim();
  const imageUrl = (interaction.fields.getTextInputValue("image_url") || "").trim();

  const eb = new EmbedBuilder()
    .setColor(ticketColor(colorName))
    .setDescription(description);

  if (title) eb.setTitle(title.slice(0, 256));
  if (imageUrl) { try { eb.setImage(imageUrl); } catch {} }

  // Send the embed publicly in the channel
  await interaction.channel.send({ embeds: [eb] }).catch(() => {});
  return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription("Embed sent.")], flags: 64 }).catch(() => {});
}


  // ─── CATALOG INTERACTIONS ────────────────────────────────────────────────
  // Dropdown: user selects a farm → show embed
  if (interaction.isStringSelectMenu() && interaction.customId === 'catselect') {
    await interaction.deferUpdate().catch(() => {});
    const _farmId = interaction.values[0];
    const _f = await store.getCatalogFarm(_farmId);
    if (!_f) return;
    const _p = await store.getCatalogPrices(interaction.guildId);
    catalogNavCache.set(interaction.message.id, { currentFarmId: _farmId, multiplier: 1 });
    await interaction.message.edit({
      embeds: [buildKelpFarmEmbed(_f, _p, 1)],
      components: buildCatalogComponents(1),
    }).catch(() => {});
    return;
  }

  // Back to catalog
  if (interaction.customId === 'catback') {
    await interaction.deferUpdate().catch(() => {});
    const _bfarms = await store.listCatalogFarms('kelp');
    if (!_bfarms.length) return;
    const _beb = new EmbedBuilder()
      .setColor(0x1a1c1f)
      .setTitle('Kelp Farm Catalog')
      .setDescription(`${_bfarms.length} farm${_bfarms.length !== 1 ? 's' : ''} available. Select one below to view details.`);
    catalogNavCache.set(interaction.message.id, { currentFarmId: null, multiplier: 1 });
    await interaction.message.edit({ embeds: [_beb], components: buildCatalogDropdown(_bfarms) }).catch(() => {});
    return;
  }

  // Download schematic
  if (interaction.customId === 'catdownload') {
    const _nav = catalogNavCache.get(interaction.message.id);
    const _farmId = _nav?.currentFarmId;
    if (!_farmId) return interaction.reply({ content: 'Select a farm first.', flags: 64 });
    const _f = await store.getCatalogFarm(_farmId);
    if (!_f || !_f.filePath) return interaction.reply({ content: 'Schematic file not available.', flags: 64 });
    const _buf = await fsp.readFile(_f.filePath).catch(() => null);
    if (!_buf) return interaction.reply({ content: 'Could not read schematic file.', flags: 64 });
    const _origName = _f.originalFileName || path.basename(_f.filePath).replace(/^[a-z0-9]+_/, '');
    return interaction.reply({ files: [new AttachmentBuilder(_buf, { name: _origName })], flags: 64 });
  }

  // Multiplier button
  if (interaction.customId === 'catmultselect') {
    const _m = new ModalBuilder().setCustomId('catmultmodal').setTitle('Change Rate Multiplier');
    _m.addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('mult').setLabel('Multiplier (e.g. 1, 2, 4, 8, 0.5)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(8)
    ));
    return interaction.showModal(_m);
  }
  // ─── END CATALOG INTERACTIONS ─────────────────────────────────────────────

  if (!interaction.isChatInputCommand()) return;
  const { commandName, options } = interaction;

  // HARD GUARANTEE: /ticket commands must ACK immediately.
  // If anything throws later (stale command definitions, option parsing, permission errors),
  // Discord would otherwise leave the interaction "thinking" forever.
  if (commandName === 'ticket' && !interaction.deferred && !interaction.replied) {
    const ticketSub = interaction.options?.getSubcommand?.(false);
    if (ticketSub !== 'requestclose') {
      try { await interaction.deferReply({ flags: 64 }); } catch {}
    }
  }
  try {

    // --- LEVELING ---
    if (commandName === 'level') {
      const sub = options.getSubcommand();
      const target = options.getUser('user') || interaction.user;

      if (sub === 'check') {
        // Public reply (not ephemeral)
        await interaction.deferReply();

        const ud = await store.getUserXp(target.id, interaction.guildId);
        const curXp = ud.xp || 0;
        const level = getLevelFromXp(curXp);
        const rank = await store.getRank(target.id, interaction.guildId).catch(() => 0);

        const prevXp = getXpForLevel(level);
        const nextXp = getXpForLevel(level + 1);
        const xpIntoLevel = Math.max(0, curXp - prevXp);
        const xpNeeded = Math.max(1, nextXp - prevXp);

        // Prefer guild display name
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        const subject = member || target;

        let tierLabel = 'COMMON';
        let tierAccent = null;
        let tierValue = 0;
        if (member) {
          const levelRoleEntries = Object.entries(C.LEVEL_ROLES || {})
            .map(([lvl, cfg]) => ({ level: Number(lvl), id: cfg?.id, color: cfg?.color || null }))
            .filter(r => r.id && member.roles.cache.has(r.id))
            .sort((a, b) => b.level - a.level);
          if (levelRoleEntries.length) {
            const highest = levelRoleEntries[0];
            const roleObj = interaction.guild.roles.cache.get(highest.id);
            const rawName = String(roleObj?.name || '').trim();
            tierLabel = rawName ? rawName.replace(/\s*role$/i, '').toUpperCase() : 'COMMON';
            tierAccent = roleObj?.hexColor && roleObj.hexColor !== '#000000' ? roleObj.hexColor : (highest.color || null);
            tierValue = highest.level || 0;
          }
        }

        const cardBuf = await renderLevelCard({
          username: member?.displayName || target.displayName || target.username,
          avatarUrl: target.displayAvatarURL({ extension: 'png', size: 256 }),
          level,
          xpIntoLevel,
          xpNeeded,
          totalXp: curXp,
          rank,
          accent: tierAccent,
          theme: 'default',
          tierLabel,
          tierValue,
        });

        const file = new AttachmentBuilder(cardBuf, { name: 'rank.png' });
        return interaction.editReply({ files: [file] });
      }

      if (sub === 'multiplier') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: 'Admin only.', flags: 64 });
        }
        const value = Math.max(0.1, Math.min(10, Number(options.getNumber('value', true)) || 1));
        await store.setXpMultiplierGlobal(value);
        return interaction.reply({ content: `XP multiplier set to **${value}x**.` });
      }

      // admin-only for add/set
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: 'Admin only.', flags: 64 });
      }

      if (sub === 'add') {
        await interaction.deferReply({ flags: 64 });
        const amt = options.getInteger('amount', true);
        const ud = await store.getUserXp(target.id, interaction.guildId);
        const curLevel = getLevelFromXp(ud.xp || 0);
        const newLevel = Math.max(0, curLevel + amt);
        const newXp = getXpForLevel(newLevel);
        await store.setXp(target.id, interaction.guildId, newXp);
        const memberTarget = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (newLevel > curLevel && memberTarget) {
          await handleLevelUp(memberTarget, newLevel, curLevel, newXp).catch(() => {});
        } else if (memberTarget) {
          await syncLevelRoles(memberTarget, newLevel).catch(() => {});
        }
        return interaction.editReply(`✅ Set ${target} to **Level ${newLevel}**.`);
      }

      if (sub === 'set') {
        await interaction.deferReply({ flags: 64 });
        const lvl = options.getInteger('level', true);
        const ud = await store.getUserXp(target.id, interaction.guildId);
        const oldLevelForSet = getLevelFromXp(ud.xp || 0);
        const newLevel = Math.max(0, lvl);
        const newXp = getXpForLevel(newLevel);
        await store.setXp(target.id, interaction.guildId, newXp);
        const memberTarget = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (newLevel > oldLevelForSet && memberTarget) {
          await handleLevelUp(memberTarget, newLevel, oldLevelForSet, newXp).catch(() => {});
        } else if (memberTarget) {
          await syncLevelRoles(memberTarget, newLevel).catch(() => {});
        }
        return interaction.editReply(`✅ Set ${target} to **Level ${newLevel}**.`);
      }
    }


    // --- TICKETS (slash commands) ---
    if (commandName === 'ticket') {
      // IMPORTANT: getSubcommand() throws if Discord thinks this command has no subcommands
      // (e.g., stale command registration). Use the safe form so we can always respond.
      const sub = options.getSubcommand(false);
      const channel = interaction.channel;
      if (!interaction.guild || !channel || channel.type !== ChannelType.GuildText) {
        return safeIReply(interaction, { content: 'Run this inside a ticket channel.', flags: 64 });
      }
      if (!sub) {
        return safeIReply(interaction, { content: '❌ This /ticket command is missing its subcommands (redeploy slash commands).', flags: 64 });
      }
      // Always ACK immediately for normal /ticket actions, but NEVER defer requestclose
      // because Discord modals must be opened from the original interaction.
      if (sub !== 'requestclose') {
        try {
          // Public confirmations (no ephemeral). Keeps UI simple and avoids deprecated ephemeral warnings.
          if (!interaction.deferred && !interaction.replied) await interaction.deferReply();
        } catch {
          try { if (!interaction.replied) await interaction.reply({ content: 'Working…' }); } catch {}
        }
      }

      let cfg, rec;
      try {
        cfg = await store.getTicketConfig();
        rec = await getOrBootstrapTicketRecord(channel.id, channel);
      } catch {
        // If storage read fails for any reason, ensure the interaction is responded to.
        return safeIReply(interaction, { content: '❌ Ticket system is busy. Try again.', flags: 64 }).catch(() => {});
      }
      if (!rec) {
        return safeIReply(interaction, { content: 'Not a ticket channel.', flags: 64 });
      }

      const member = interaction.member;
      const isStaff = isStaffMember(member, cfg);
      // People with the spawner-access role can /ticket rename/claim/close/requestclose
      // inside any spawner ticket channel they have access to.
      const spawnerOps = hasSpawnerTicketAccess(member) && isSpawnerTicketChannel(channel);
      const canManageTicket = isStaff || spawnerOps;

      if (sub === 'rename') {
        if (!canManageTicket) return safeIReply(interaction, { content: 'Staff only.' });
        try {
          const newNameRaw = options.getString('name', true);
          const clean = String(newNameRaw)
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 92);
          if (!clean) {
            await safeIReply(interaction, { content: '❌ Invalid name.' });
            return;
          }

          const latest = await store.getTicketRecord(channel.id).catch(() => rec);
          const patch = { channelBaseName: clean, manualRename: true };
          await store.updateTicketRecord(channel.id, patch).catch(() => {});
          const effective = { ...(latest || rec || {}), ...patch };
          await syncTicketChannelName(channel, effective).catch(() => {});
          await store.recordTicketRenamed(interaction.guildId, interaction.user.id).catch(() => {});
          await safeIReply(interaction, { content: '✅ Renamed.' });
        } catch (e) {
          await safeIReply(interaction, { content: '❌ Rename failed (missing permissions or invalid channel).' });
        }
        return;
      }


      // --- BUILDING CLAIM / UNCLAIM (slash) ---
      if (sub === 'claim' || sub === 'unclaim') {
        if (!canManageTicket) return safeIReply(interaction, { content: 'Staff only.' });

        const latest = await store.getTicketRecord(channel.id).catch(() => rec);
        const cur = latest || rec;

        if (sub === 'claim') {
          if (cur.claimedById) {
            await syncTicketChannelName(channel, cur).catch(() => {});
            await safeUpdateTicketControls(channel, cur.claimedById, cur).catch(() => {});
            return safeIReply(interaction, { content: `Already claimed by <@${cur.claimedById}>.` });
          }
          const now = Date.now();
          const claimerId = String(interaction.user.id);
          const claimerUsername = interaction.user.username;
          await store.updateTicketRecord(channel.id, { claimedById: claimerId, claimedAt: now, claimerUsername }).catch(() => {});
          await store.recordTicketClaimed(channel.guild?.id || interaction.guildId, claimerId).catch(() => {});
          const effective = (await store.getTicketRecord(channel.id).catch(() => null)) || { ...(cur || {}), claimedById: claimerId, claimedAt: now, claimerUsername };
          await channel.send({ embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription(`<@${claimerId}> claimed this ticket.`)] }).catch(() => {});
          if (effective.creatorId) {
            await sendTicketQueueDm(effective.creatorId, buildTicketDmEmbed({ title: 'Ticket Claimed', description: `Your ticket **${effective.label || channel.name}** was claimed by <@${claimerId}>.`, channelId: channel.id, extraFields: [{ name: `${TICKET_UI.claimedBy} Claimed By`, value: `<@${claimerId}>`, inline: true }] }));
          }
          await syncTicketChannelName(channel, effective).catch(() => {});
          await safeUpdateTicketControls(channel, claimerId, effective).catch(() => {});
          return safeIReply(interaction, { content: '✅ Claimed.' });
        }

        // unclaim
        if (!cur.claimedById) {
          await syncTicketChannelName(channel, { ...(cur||{}), claimedById: null }).catch(() => {});
          await safeUpdateTicketControls(channel, null, cur).catch(() => {});
          return safeIReply(interaction, { content: 'Not claimed.' });
        }
        const claimedBy = String(cur.claimedById);
        const actor = String(interaction.user.id);
        if (claimedBy !== actor && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return safeIReply(interaction, { content: `Only <@${claimedBy}> (or admin) can unclaim.` });
        }
        await store.updateTicketRecord(channel.id, { claimedById: null, claimedAt: null }).catch(() => {});
        const effective = (await store.getTicketRecord(channel.id).catch(() => null)) || { ...(cur||{}), claimedById: null, claimedAt: null };
        await channel.send({ embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription(`<@${actor}> unclaimed this ticket.`)] }).catch(() => {});
        if (cur.creatorId) {
          await sendTicketQueueDm(cur.creatorId, buildTicketDmEmbed({ title: 'Ticket Returned', description: `Your ticket **${cur.label || channel.name}** is back in the queue.`, channelId: channel.id }));
        }
        await syncTicketChannelName(channel, effective).catch(() => {});
        await safeUpdateTicketControls(channel, null, effective).catch(() => {});
        return safeIReply(interaction, { content: '✅ Unclaimed.' });
      }



      if (sub === 'add') {
        if (!isStaff) return safeIReply(interaction, { content: 'Staff only.', flags: 64 });
        const user = options.getUser('user', true);
        await channel.permissionOverwrites.edit(user.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          AttachFiles: true,
        }).catch(() => {});
        await safeIReply(interaction, { content: `✅ Added <@${user.id}>.`, flags: 64 });
        return;
      }

      if (sub === 'requestclose') {
        const actingMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => interaction.member);
        const actingIsStaff = isStaffMember(actingMember, cfg);
        const actingIsBuilder = isBuilderMember(actingMember);
        const actingIsSpawnerOps = hasSpawnerTicketAccess(actingMember) && isSpawnerTicketChannel(channel);
        if (!actingIsStaff && !actingIsBuilder && !actingIsSpawnerOps) return safeIReply(interaction, { content: 'Staff or builder only.', flags: 64 });
        const closeGate = await canCloseTicket(channel.id);
        if (!closeGate.ok) return safeIReply(interaction, { content: closeGate.reason, flags: 64 });
        const reqId = `${channel.id}:${Date.now()}:${interaction.user.id}`;
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`tk_reqclose_cancel:${reqId}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`tk_reqclose_accept:${reqId}`).setLabel('Close').setStyle(ButtonStyle.Danger),
        );
        const closeReqEmbed = new EmbedBuilder()
          .setColor(0x08a4a7)
          .setDescription(`<@${interaction.user.id}> requested to close this ticket.

Only the ticket creator can continue.`);
        await channel.send({
          content: rec?.creatorId ? `<@${rec.creatorId}>` : '',
          allowedMentions: rec?.creatorId ? { users: [rec.creatorId] } : { parse: [] },
          embeds: [closeReqEmbed],
          components: [row],
        }).catch(() => {});
        return safeIReply(interaction, { content: '✅ Close request sent.', flags: 64 });
      }

      if (sub === 'close') {
        const hasTicketAccess = canAccessTicketChannel(channel, interaction.member);
        if (!isStaff && !isBuilderMember(member) && !hasTicketAccess && rec.creatorId !== interaction.user.id) {
          return safeIReply(interaction, { content: 'Only people with access to this ticket can close it.', flags: 64 });
        }
        const closeGate = await canCloseTicket(channel.id);
        if (!closeGate.ok) {
          return safeIReply(interaction, { content: closeGate.reason, flags: 64 });
        }
        const reasonOpt = (options.getString('reason', false) || '').trim();
        await safeIReply(interaction, { embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription('Closing ticket…')], flags: 64 }).catch(() => {});
        setImmediate(() => closeTicket({ guild: interaction.guild, channel, closerId: interaction.user.id, reason: reasonOpt || 'Closed by /ticket close' }).catch(() => {}));
        return;
      }
    }


    // /receiver handler removed — was never registered as a slash command.

    
    // /xpmultiplier handler removed — duplicated by /level multiplier.




    // --- DROPDOWN (modal-based, multiline) ---

    // --- VOUCH ADD ---
    if (commandName === 'vouch') {
      const sub = options.getSubcommand();
      await interaction.deferReply({ flags: 64 });
      const can = interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
        interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
      if (!can) return interaction.editReply('Missing Manage Server permission.');

      if (sub === 'add') {
        const target = options.getUser('user', true);
        const amount = options.getInteger('amount', true);
        const reason = options.getString('reason') || null;
        const count = await store.addVouchesAmount(target.id, interaction.guildId, amount);
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (member) await syncNickname(member).catch(() => {});
        return interaction.editReply(`✅ Added **${amount}** vouch(es) to ${target}. They now have **${count}**.`);
      }
      if (sub === 'remove') {
        const target = options.getUser('user', true);
        const amount = options.getInteger('amount', true);
        const reason = options.getString('reason') || null;
        const count = await store.removeVouchesAmount(target.id, interaction.guildId, amount);
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (member) await syncNickname(member).catch(() => {});
        return interaction.editReply(`✅ Removed **${amount}** vouch(es) from ${target}. They now have **${count}**.`);
      }
      if (sub === 'check') {
        const target = options.getUser('user', true);
        const count = await store.getVouches(interaction.guildId);
        const rec = count.find(v => v.userId === target.id);
        const total = rec?.vouchers?.length || 0;
        return interaction.editReply(`${target} has **${total}** vouch(es).`);
      }
    }
    // --- BUILD START ---
    if (commandName === 'build') {
      const sub = options.getSubcommand();
      if (sub === 'start') {
        const _gid = interaction.guildId;
        const _chiefB   = await store.getConfigValue(_gid, 'ROLE_CHIEF_BUILDER').catch(() => null)  || C.ROLE_BUILDER_1;
        const _trainedB = await store.getConfigValue(_gid, 'ROLE_TRAINED_BUILDER').catch(() => null) || C.ROLE_BUILDER_2;
        const _traineeB = await store.getConfigValue(_gid, 'ROLE_TRAINEE_BUILDER').catch(() => null) || C.ROLE_BUILDER_3;
        const allowedRoles = [_chiefB, _trainedB, _traineeB].filter(id => id && id.length > 5);
        const canUse = interaction.member?.roles?.cache?.some(r => allowedRoles.includes(r.id)) || interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
        if (!canUse) return interaction.reply({ content: 'Builders only.', flags: 64 });

        // Must be run inside a building category ticket (check DB category ID)
        const channel = interaction.channel;
        if (!channel || channel.type !== ChannelType.GuildText) {
          return interaction.reply({ content: '❌ Run this inside a building ticket channel.', flags: 64 });
        }
        const _buildingCatId = BUILDING_TICKET_CATEGORY_ID && BUILDING_TICKET_CATEGORY_ID.length > 5 ? BUILDING_TICKET_CATEGORY_ID : null;
        const parentId = channel.parentId;
        if (!_buildingCatId || String(parentId) !== String(_buildingCatId)) {
          return interaction.reply({ content: '❌ This command can only be used in building category tickets.', flags: 64 });
        }

        // Must be the claimer of this ticket
        const ticketRec = await store.getTicketRecord(channel.id).catch(() => null);
        if (!ticketRec) return interaction.reply({ content: '❌ This channel is not a tracked ticket.', flags: 64 });
        if (!ticketRec.claimedById) return interaction.reply({ content: '❌ You must claim this ticket first.', flags: 64 });
        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
        if (ticketRec.claimedById !== interaction.user.id && !isAdmin) {
          return interaction.reply({ content: `❌ Only the claimer (<@${ticketRec.claimedById}>) can start a build here.`, flags: 64 });
        }

        await interaction.deferReply({ flags: 64 });

        const customerIgn = options.getString('customer_ign', true).trim();
        const builderIgn = options.getString('builder_ign', true).trim();
        const buildType = options.getString('build_name', true).trim().replace(/\b\w/g, c => c.toUpperCase());
        const customerUser = options.getUser('customer_discord', true);
        const priceRaw = options.getString('price', true);
        const price = parseNumber(priceRaw);
        if (!price || price <= 0) return interaction.editReply('Invalid price. Use formats like `5m`, `500k`.');
        const receiverDiscordId = null;
        const receiverIgn = C.DEFAULT_RECEIVER_IGN || C.STAFF_PAY_RECEIVER_IGN || 'iEtZ';

        const buildId = generateId();
        const createdAt = Date.now();
        const customerDiscordId = customerUser.id;
        const builderDiscordId = interaction.user.id; // builder is the one running the command

        if (!DONUTSMP_API_KEY) {
          return interaction.editReply('❌ DONUTSMP_API_KEY is missing in your .env — cannot start paywatch.');
        }

        // ── Step 1: Start customer→receiver paywatch ──────────────────────────────
        let payerStart = null, receiverStart = null;
        try {
          payerStart = await getUserBalance({ baseUrl: DONUTSMP_BASE_URL, pathTemplate: DONUTSMP_STATS_PATH, apiKey: DONUTSMP_API_KEY, user: customerIgn, balancePath: DONUTSMP_BALANCE_PATH });
          receiverStart = await getUserBalance({ baseUrl: DONUTSMP_BASE_URL, pathTemplate: DONUTSMP_STATS_PATH, apiKey: DONUTSMP_API_KEY, user: receiverIgn, balancePath: DONUTSMP_BALANCE_PATH });
        } catch (e) {
          return interaction.editReply(`❌ Could not read balances. Check IGN spelling. (${e.message})`);
        }

        const watchId = generateId();
        const now = Date.now();
        const expires = now + PAYWATCH_MAX_MINUTES * 60 * 1000;

        const prewatch = await store.addWatch({
          id: watchId, status: 'WATCHING',
          guild_id: interaction.guildId,
          channel_id: channel.id,
          creator_id: interaction.user.id,
          payer_discord_id: customerDiscordId,
          payer_ign: customerIgn,
          receiver_ign: receiverIgn,
          amount: price,
          schematic: null,
          schematic_id: null, file_path: null, note: null,
          payer_start_balance: payerStart, receiver_start_balance: receiverStart,
          payer_end_balance: payerStart, receiver_end_balance: receiverStart,
          created_at: now, expires_at: expires, last_check_at: null, message_id: null,
          pendingBuildId: buildId,
        });

        const pwMsg = await channel.send({
          embeds: [new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('Awaiting Customer Payment')
            .setDescription(`Waiting for **${customerIgn}** to pay **${money(price)}** to **${receiverIgn}**.\n\nBuild tracking will begin automatically once payment is confirmed.`)
            .addFields(
              { name: 'Build', value: buildType, inline: true },
              { name: `${E_SENDER} Customer IGN`, value: `\`${customerIgn}\``, inline: true },
              { name: `${E_RECEIVER} Builder IGN`, value: `\`${builderIgn}\``, inline: true },
              { name: `${E_PRICE} Price`, value: money(price), inline: true },
              { name: `${E_RECEIVER} Receiver`, value: `\`${receiverIgn}\``, inline: true },
            )
            .setFooter({ text: `Payment Watch ID: ${watchId}` })
            .setTimestamp()],
          components: cancelRow(watchId, true),
        }).catch(() => null);

        if (pwMsg?.id) await store.updateWatch(watchId, { message_id: pwMsg.id });

        // ── Store the build job in WAITING_PAYMENT state ─────────────────────────
        await store.addBuildJob({
          id: buildId,
          guildId: interaction.guildId,
          status: 'WAITING_PAYMENT',
          buildType,
          customerIgn,
          customerDiscordId,
          builderIgn,
          builderDiscordId,
          price,
          receiverDiscordId,
          receiverIgn,
          createdAt,
          createdBy: interaction.user.id,
          ticketChannelId: channel.id,
          paywatchId: watchId,
          channelId: null, // tracking channel msg set after payment
          messageId: null,
        });

        // Keep the ticket yellow until customer payment is confirmed and tracking begins.
        await store.updateTicketRecord(channel.id, {
          ticketType: 'normal',
          buildFarmName: buildType,
          buildAmount: price,
          claimerUsername: interaction.user.username,
          claimedById: interaction.user.id,
          manualRename: false,
        }).catch(() => {});
        const updatedRec = await store.getTicketRecord(channel.id).catch(() => null);
        const renameBase = updatedRec || { ...ticketRec, ticketType: 'normal', buildFarmName: buildType, buildAmount: price, claimerUsername: interaction.user.username };
        await syncTicketChannelName(channel, renameBase, { notifyChannel: channel, commandLabel: '/build start' }).catch(() => {});

        startPaywatchPolling(watchId);
        return interaction.editReply(`✅ Payment watch started in this ticket. Build tracking will begin automatically once **${customerIgn}** pays **${money(price)}** to **${receiverIgn}**.`);
      }

      // --- /build edit ---
      if (sub === 'edit') {
        const allowedRoles = [C.ROLE_BUILDER_3, C.ROLE_BUILDER_2, C.ROLE_BUILDER_1].filter(Boolean);
        const canUse = interaction.member?.roles?.cache?.some(r => allowedRoles.includes(r.id))
          || interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
        if (!canUse) return interaction.reply({ content: 'Builders only.', flags: 64 });

        await interaction.deferReply({ flags: 64 });

        const buildId = options.getString('build_id', true).trim();
        const job = await store.getBuildJob(buildId).catch(() => null);
        if (!job) return interaction.editReply(`❌ No build found with ID \`${buildId}\`.`);

        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
        const isBuilder = job.builderDiscordId === interaction.user.id;
        if (!isBuilder && !isAdmin) return interaction.editReply('❌ Only the assigned builder or an admin can edit this build.');

        const completedStatuses = ['COMPLETE', 'CANCELLED'];
        if (completedStatuses.includes(job.status)) {
          return interaction.editReply(`❌ Cannot edit a build that is already **${job.status}**.`);
        }

        const newPriceRaw   = options.getString('price');
        const newBuilder    = options.getUser('builder');
        const newBuilderIgn = options.getString('builder_ign');
        const newCustomerIgn = options.getString('customer_ign');
        const newBuildName  = options.getString('build_name');

        if (!newPriceRaw && !newBuilder && !newBuilderIgn && !newCustomerIgn && !newBuildName) {
          return interaction.editReply('❌ Provide at least one field to change.');
        }

        const patch = {};
        const changes = [];

        if (newBuilderIgn) { patch.builderIgn = newBuilderIgn.trim(); changes.push(`Builder IGN: \`${newBuilderIgn.trim()}\``); }
        if (newCustomerIgn) { patch.customerIgn = newCustomerIgn.trim(); changes.push(`Customer IGN: \`${newCustomerIgn.trim()}\``); }
        if (newBuildName) {
          patch.buildType = newBuildName.trim().replace(/\b\w/g, c => c.toUpperCase());
          changes.push(`Build: \`${patch.buildType}\``);
        }
        if (newBuilder) {
          patch.builderDiscordId = newBuilder.id;
          changes.push(`Builder Discord: <@${newBuilder.id}>`);
        }

        // Handle price change: create additional paywatch for the difference
        let priceWatchId = null;
        if (newPriceRaw) {
          const newPrice = parseNumber(newPriceRaw);
          if (!newPrice || newPrice <= 0) return interaction.editReply('❌ Invalid price format.');
          if (newPrice <= job.price) return interaction.editReply(`❌ New price (${money(newPrice)}) must be higher than current price (${money(job.price)}). To reduce the price just edit it directly — contact an admin.`);

          const priceDiff = newPrice - job.price;
          changes.push(`Price: ${money(job.price)} → ${money(newPrice)} (+${money(priceDiff)})`);

          // Determine builder's tax rate
          const builderMemberId = patch.builderDiscordId || job.builderDiscordId;
          const taxRate = await getBuilderTaxRate(interaction.guild, builderMemberId);
          const watchAmount = Math.floor(priceDiff * taxRate); // taxed portion of the extra

          if (DONUTSMP_API_KEY) {
            let payerStart = null, receiverStart = null;
            try {
              payerStart = await getUserBalance({ baseUrl: DONUTSMP_BASE_URL, pathTemplate: DONUTSMP_STATS_PATH, apiKey: DONUTSMP_API_KEY, user: job.customerIgn, balancePath: DONUTSMP_BALANCE_PATH });
              receiverStart = await getUserBalance({ baseUrl: DONUTSMP_BASE_URL, pathTemplate: DONUTSMP_STATS_PATH, apiKey: DONUTSMP_API_KEY, user: job.receiverIgn, balancePath: DONUTSMP_BALANCE_PATH });
            } catch {}

            priceWatchId = generateId();
            const now = Date.now();
            const expires = now + PAYWATCH_MAX_MINUTES * 60 * 1000;
            const priceWatch = await store.addWatch({
              id: priceWatchId, status: 'WATCHING',
              guild_id: interaction.guildId,
              channel_id: interaction.channelId,
              creator_id: interaction.user.id,
              payer_discord_id: job.customerDiscordId || interaction.user.id,
              payer_ign: job.customerIgn,
              receiver_ign: job.receiverIgn,
              amount: priceDiff,
              schematic: null,
              schematic_id: null, file_path: null, note: null,
              payer_start_balance: payerStart, receiver_start_balance: receiverStart,
              payer_end_balance: payerStart, receiver_end_balance: receiverStart,
              created_at: now, expires_at: expires, last_check_at: null, message_id: null,
              buildEditJobId: buildId,
              buildEditNewPrice: newPrice,
            });

            const editWatchMsg = await interaction.channel.send({
              embeds: [new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle('Build Price Adjustment — Additional Payment')
                .setDescription(`Waiting for **${job.customerIgn}** to pay the additional **${money(priceDiff)}** to **${job.receiverIgn}**.`)
                .addFields(
                  { name: 'Current Price', value: money(job.price), inline: true },
                  { name: 'New Price', value: money(newPrice), inline: true },
                  { name: 'Additional Amount', value: money(priceDiff), inline: true },
                )
                .setFooter({ text: `Build ID: ${buildId} • Watch ID: ${priceWatchId}` })],
              components: cancelRow(priceWatchId, true),
            }).catch(() => null);

            if (editWatchMsg?.id) await store.updateWatch(priceWatchId, { message_id: editWatchMsg.id });
            startPaywatchPolling(priceWatchId);
          }

          // Update the price immediately so the embed reflects it now
          patch.price = newPrice;
          patch.taxRate = taxRate;
        }

        // Apply patch to job
        await store.updateBuildJob(buildId, patch);
        const updatedJob = await store.getBuildJob(buildId);

        // Update the tracking embed if we can find it
        if (updatedJob.buildMessageId && updatedJob.buildChannelId) {
          try {
            const buildCh = await client.channels.fetch(updatedJob.buildChannelId).catch(() => null);
            if (buildCh) {
              const buildMsg = await buildCh.messages.fetch(updatedJob.buildMessageId).catch(() => null);
              if (buildMsg) {
                // Rebuild embed in whatever state the job is currently in
                let components = buildMsg.components; // keep existing buttons
                const updatedEmbed = buildTrackingEmbed(updatedJob, updatedJob.status);
                // If AWAITING_PAYOUT, make sure Pay button is there
                if (updatedJob.status === 'AWAITING_PAYOUT') {
                  const payBtn = new ButtonBuilder().setCustomId(`build_admin_pay:${buildId}`).setLabel('Pay Builder').setStyle(ButtonStyle.Success);
                  components = [new ActionRowBuilder().addComponents(payBtn)];
                }
                await buildMsg.edit({ embeds: [updatedEmbed], components }).catch(() => {});
              }
            }
          } catch {}
        }

        // Update ticket channel name if build name changed
        if (newBuildName && updatedJob.ticketChannelId) {
          const ticketCh = await client.channels.fetch(updatedJob.ticketChannelId).catch(() => null);
          const ticketRec = ticketCh ? await store.getTicketRecord(updatedJob.ticketChannelId).catch(() => null) : null;
          if (ticketCh && ticketRec) {
            await store.updateTicketRecord(updatedJob.ticketChannelId, { buildFarmName: patch.buildType }).catch(() => {});
            const updatedRec = await store.getTicketRecord(updatedJob.ticketChannelId).catch(() => ({ ...ticketRec, buildFarmName: patch.buildType }));
            await syncTicketChannelName(ticketCh, updatedRec, { notifyChannel: ticketCh, commandLabel: '/build edit' }).catch(() => {});
          }
        }

        return interaction.editReply(`✅ Build \`${buildId}\` updated:\n${changes.map(c => `• ${c}`).join('\n')}${priceWatchId ? `\n\n💰 Additional payment watch started for **${money(patch.price - job.price)}**.` : ''}`);
      }


      if (sub === 'remove') {
        await interaction.deferReply({ flags: 64 });
        const canManage = interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator)
          || hasStaffRole(interaction.member)
          || isBuilderMember(interaction.member);
        if (!canManage) return interaction.editReply('Staff or builders only.');

        const requests = (await store.listBuildRequests(interaction.guildId).catch(() => []))
          .filter(r => String(r.status || '').toLowerCase() === 'queued')
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
          .slice(0, 25);
        if (!requests.length) return interaction.editReply('No queued builds found.');

        const requestOptions = await Promise.all(requests.map(async (req) => {
          const customerMember = req.userId ? await interaction.guild.members.fetch(req.userId).catch(() => null) : null;
          const customerUser = customerMember?.user || (req.userId ? await client.users.fetch(req.userId).catch(() => null) : null);
          const customerTag = customerUser ? `@${customerUser.username}` : '@unknown';
          const detailText = String(req.details || 'No details').replace(/\s+/g, ' ').trim();
          const desc = `${detailText || 'No details'}`.slice(0, 100);
          return {
            label: `${customerTag} • ${req.buildType || 'Build'} • ${req.ign || 'Unknown'}`.slice(0, 100),
            value: req.id,
            description: desc,
          };
        }));

        const select = new StringSelectMenuBuilder()
          .setCustomId('build_remove_select')
          .setPlaceholder('Select a queued build to remove')
          .addOptions(requestOptions);
        const row = new ActionRowBuilder().addComponents(select);
        const eb = new EmbedBuilder()
          .setColor(0x2b2d31)
          .setTitle('Remove Queued Build')
          .setDescription('Select one queued build below. You will get a confirmation step before anything is removed.');
        return interaction.editReply({ embeds: [eb], components: [row] });
      }
      // /build lb has been folded into /leaderboard builder.

      // --- /build history ---
      if (sub === 'history') {
        await interaction.deferReply({ flags: 64 });
        const targetUser = options.getUser('person', true);
        const records = await store.listBuildRecordsByDiscord(interaction.guildId, targetUser.id).catch(() => []);

        if (!records.length) {
          return safeIReply(interaction, { content: `No completed builds found for <@${targetUser.id}>.`, flags: 64 });
        }

        const lines = records.slice(0, 25).map((r, i) => formatBuildHistoryLine(r, i + 1, money, targetUser.id));

        const total = records.length;
        const eb = new EmbedBuilder()
          .setColor(0x2b2d31)
          .setTitle(`Build History - ${targetUser.username}`)
          .setDescription(lines.join('\n').slice(0, 4096))
          .setFooter({ text: `Total builds: ${total}` })
          .setTimestamp();
        return safeIReply(interaction, { embeds: [eb] });
      }
    }

    // --- PAYWATCH ---
  
// staffpay command removed

  // ─── /list ────────────────────────────────────────────────────────────────
  if (commandName === 'list') {
    await interaction.deferReply({ flags: 64 });
    const _role = options.getRole('role', true);
    await interaction.guild.members.fetch().catch(() => {});
    const _members = _role.members.filter(m => !m.user.bot);
    if (_members.size > 50) {
      return interaction.editReply(`❌ That role has **${_members.size}** members — this command only works for roles with 50 or fewer.`);
    }
    if (_members.size === 0) {
      return interaction.editReply(`No members currently have the **${_role.name}** role.`);
    }
    const _lines = _members.map(m => `<@${m.id}> — \`${m.user.username}\``).join('\n');
    return interaction.editReply({ embeds: [new EmbedBuilder()
      .setColor(_role.color || 0x2b2d31)
      .setTitle(`${_role.name} — ${_members.size} member${_members.size === 1 ? '' : 's'}`)
      .setDescription(_lines.slice(0, 4096))
    ] });
  }

  // ─── /catalog ────────────────────────────────────────────────────────────
  if (commandName === 'kelp') {
    const _sub = options.getSubcommand();
    // panel is public; all other subs are staff-only
    if (_sub !== 'panel' && !isCatalogStaff(interaction.member))
      return interaction.reply({ content: 'Staff only.', flags: 64 });
    await interaction.deferReply({ flags: 64 });

    if (_sub === 'setprice') {
      const _item = options.getString('item', true);
      const _price = options.getNumber('price', true);
      await store.setCatalogPrice(interaction.guildId, _item, _price);
      return interaction.editReply(`✅ **${_item}** price set to **${_price.toLocaleString()}** coins.`);
    }
    if (_sub === 'panel') {
      const farms = await store.listCatalogFarms('kelp');
      if (!farms.length) {
        return interaction.editReply({ content: 'No farms added yet.', flags: 64 });
      }
      const eb = new EmbedBuilder()
        .setColor(0x1a1c1f)
        .setTitle('Kelp Farm Catalog')
        .setDescription(`${farms.length} farm${farms.length !== 1 ? 's' : ''} available. Select one below to view details.`);
      // Send as a public message (not ephemeral) so anyone can interact
      await interaction.deleteReply().catch(() => {});
      const _msg = await interaction.channel.send({ embeds: [eb], components: buildCatalogDropdown(farms) });
      // Store nav keyed to this specific message id so multiple panels can coexist
      catalogNavCache.set(_msg.id, { currentFarmId: null, multiplier: 1 });
      return;
    }
    if (_sub === 'add') {
      const _file = options.getAttachment('schematic', true);
      const _img  = options.getAttachment('image');
      const _fid  = generateId();
      const _dir  = path.join(process.cwd(), 'schematics', 'catalog');
      await ensureDir(_dir);
      const _out  = path.join(_dir, `${_fid}_${_file.name}`);
      try { await downloadToFile(_file.url, _out); }
      catch (_e) { return interaction.editReply(`❌ Failed to download schematic: ${_e.message}`); }
      const _kphRaw = options.getString('kelp_per_hour', true);
      const _farm = {
        id: _fid, category: 'kelp',
        name: options.getString('name', true),
        blaze_loaders: options.getInteger('blaze_loaders', true),
        bone_loaders: options.getInteger('bone_loaders', true),
        smokers: options.getInteger('smokers', true),
        kelp_per_hour: parseKelpNumber(_kphRaw) || 0,
        size: options.getString('size', true),
        bone_input: options.getString('bone_input', true),
        bone_storage_items: options.getInteger('bone_storage_items', true),
        blaze_storage_items: options.getInteger('blaze_storage_items', true),

        tested: options.getBoolean('tested', true),
        designer: options.getUser('designer', true).username,
        designerMention: `<@${options.getUser('designer', true).id}>`,
        filePath: _out,
        originalFileName: _file.name,
        imageUrl: _img?.url || null,
        addedBy: interaction.user.id, addedAt: Date.now(),
      };
      await store.addCatalogFarm(_farm);
      for (const _ch of interaction.guild.channels.cache.values()) {
        if (_ch.type !== ChannelType.GuildText) continue;
        const _pid = await store.getCatalogPanel(_ch.id).catch(() => null);
        if (_pid) refreshCatalogPanel(_ch).catch(() => {});
      }
      return interaction.editReply(`✅ **${_farm.name}** added (ID: \`${_fid}\`).`);
    }
    if (_sub === 'remove') {
      const _ok = await store.removeCatalogFarm(options.getString('id', true));
      return interaction.editReply(_ok ? `✅ Removed.` : `❌ Farm not found.`);
    }

    if (_sub === 'edit') {
      const _id = options.getString('id', true).trim();
      const _existing = await store.getCatalogFarm(_id);
      if (!_existing) return interaction.editReply(`❌ Farm \`${_id}\` not found. Check the ID in the embed footer.`);

      const _patch = {};

      if (options.getString('name', false))         _patch.name           = options.getString('name');
      if (options.getInteger('blaze_loaders', false) !== null) _patch.blaze_loaders  = options.getInteger('blaze_loaders');
      if (options.getInteger('bone_loaders', false)  !== null) _patch.bone_loaders   = options.getInteger('bone_loaders');
      if (options.getInteger('smokers', false)       !== null) _patch.smokers        = options.getInteger('smokers');
      if (options.getString('kelp_per_hour', false))           _patch.kelp_per_hour  = parseKelpNumber(options.getString('kelp_per_hour')) || _existing.kelp_per_hour;
      if (options.getString('size', false))                    _patch.size           = options.getString('size');
      if (options.getString('bone_input', false))              _patch.bone_input     = options.getString('bone_input');
      if (options.getInteger('bone_storage_items', false) !== null) _patch.bone_storage_items = options.getInteger('bone_storage_items');
      if (options.getInteger('blaze_storage_items', false) !== null) _patch.blaze_storage_items = options.getInteger('blaze_storage_items');
      if (options.getBoolean('tested', false) !== null)        _patch.tested         = options.getBoolean('tested');

      const _newDesigner = options.getUser('designer', false);
      if (_newDesigner) {
        _patch.designer        = _newDesigner.username;
        _patch.designerMention = `<@${_newDesigner.id}>`;
      }

      // Replace schematic file if provided
      const _newFile = options.getAttachment('schematic', false);
      if (_newFile) {
        const _dir = path.join(process.cwd(), 'schematics', 'catalog');
        await ensureDir(_dir);
        const _out = path.join(_dir, `${_id}_${_newFile.name}`);
        try {
          await downloadToFile(_newFile.url, _out);
          _patch.filePath         = _out;
          _patch.originalFileName = _newFile.name;
        } catch (_e) {
          return interaction.editReply(`❌ Failed to download new schematic: ${_e.message}`);
        }
      }

      // Replace image if provided
      const _newImg = options.getAttachment('image', false);
      if (_newImg) _patch.imageUrl = _newImg.url;

      if (!Object.keys(_patch).length)
        return interaction.editReply('❌ No changes provided.');

      await store.updateCatalogFarm(_id, _patch);

      // Refresh all panels
      for (const _ch of interaction.guild.channels.cache.values()) {
        if (_ch.type !== ChannelType.GuildText) continue;
        const _pid = await store.getCatalogPanel(_ch.id).catch(() => null);
        if (_pid) refreshCatalogPanel(_ch).catch(() => {});
      }

      const _changed = Object.keys(_patch).join(', ');
      return interaction.editReply(`✅ Farm \`${_id}\` updated. Changed: \`${_changed}\``);
    }
    return;
  }

  if (commandName === 'pay') {
      const sub = options.getSubcommand();

      if (sub === 'start') {
        await interaction.deferReply();

        if (!DONUTSMP_API_KEY) {
          return interaction.editReply('❌ DONUTSMP_API_KEY is missing in your .env');
        }

        const payer = options.getUser('payer', true);
        const payerIgnRaw = options.getString('payer_ign', true);
        const payer_ign = sanitizeDisplayName(payerIgnRaw.trim(), { maxLen: 16 });
        const amountRaw = options.getString('amount', true);
        const amount = parseNumber(amountRaw);
        const receiverRaw = options.getString('receiver', true);
        const receiver_ign = sanitizeDisplayName(receiverRaw.trim(), { maxLen: 16 });
        const reasonRaw = options.getString('reason') || '';
        const schematic = 'Payment';
        const schematic_id = null;
        const file_path = null;
        const note = reasonRaw.trim() ? sanitizeDisplayName(reasonRaw.trim(), { maxLen: 64 }) : 'Payment';

        if (!amount || amount <= 0) {
          return interaction.editReply('❌ Invalid amount. Use formats like `500k`, `1m`, `250000`.');
        }

        let payerStart = null;
        let receiverStart = null;
        try {
          payerStart = await getUserBalance({ baseUrl: DONUTSMP_BASE_URL, pathTemplate: DONUTSMP_STATS_PATH, apiKey: DONUTSMP_API_KEY, user: payer_ign, balancePath: DONUTSMP_BALANCE_PATH });
          receiverStart = await getUserBalance({ baseUrl: DONUTSMP_BASE_URL, pathTemplate: DONUTSMP_STATS_PATH, apiKey: DONUTSMP_API_KEY, user: receiver_ign, balancePath: DONUTSMP_BALANCE_PATH });
        } catch (e) {
          return interaction.editReply(`❌ Could not read balances. Check IGN spelling. (${e.message})`);
        }

        const watchId = generateId();
        const created = Date.now();
        const expires = created + PAYWATCH_MAX_MINUTES * 60 * 1000;

        const w = await store.addWatch({
          id: watchId,
          status: 'WATCHING',
          guild_id: interaction.guildId,
          channel_id: interaction.channelId,
          creator_id: interaction.user.id,
          payer_discord_id: payer.id,
          payer_ign,
          receiver_ign,
          amount,
          schematic,
          schematic_id,
          file_path,
          note,
          payer_start_balance: payerStart,
          receiver_start_balance: receiverStart,
          payer_end_balance: payerStart,
          receiver_end_balance: receiverStart,
          created_at: created,
          expires_at: expires,
          last_check_at: null,
          message_id: null
        });

        const msg = await interaction.editReply({ embeds: [watchEmbed(w)], components: cancelRow(watchId, true) });
        if (msg?.id) await store.updateWatch(watchId, { message_id: msg.id });
        await startPaywatchPolling(watchId);
        return;
      }

      if (sub === 'complete') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: '❌ Admins only.', flags: 64 });
        }
        await interaction.deferReply({ flags: 64 });

        const watchId = options.getString('watch_id', true).trim();
        const w = await store.getWatch(watchId).catch(() => null);
        if (!w) return interaction.editReply(`❌ No paywatch found with ID \`${watchId}\`.`);
        if (w.status !== 'WATCHING') {
          return interaction.editReply(`❌ That paywatch is already **${w.status}** — can only force-complete watches that are still WATCHING.`);
        }

        try {
          await handleWatchPaid(watchId);
          return interaction.editReply(`✅ Paywatch \`${watchId}\` force-completed.\n> ${money(w.amount)} · \`${w.payer_ign}\` → \`${w.receiver_ign}\``);
        } catch (e) {
          console.error('Force-complete error:', e);
          return interaction.editReply(`❌ Failed to force-complete: ${e.message}`);
        }
      }

      if (sub === 'history') {
        await interaction.deferReply({ flags: 64 });
        const limit = Math.max(1, Math.min(25, options.getInteger('limit') || 10));
        const all = await store.listPayments({ receiverIgn: null, limit: 5000 });
        const list = all.filter(p => p.guild_id === interaction.guildId).slice(0, limit);
        if (!list.length) return interaction.editReply('No payments logged yet.');

        const lines = list.map(p => `• ${ts(p.paid_at)} — **${p.schematic}** — ${money(p.amount)} — <@${p.payer_discord_id}> (IGN \`${p.payer_ign}\`) → \`${p.receiver_ign}\`${p.note ? ` — note: ${p.note}` : ''}`);
        return safeIReply(interaction, { content: lines.join('\n'), flags: 64 });
      }
    }

    // --- GIVEAWAY ---
if (commandName === 'giveaway') {
      const sub = options.getSubcommand();
      if (!canManageGiveaways(interaction.member) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: 'Giveaway Manager role required.' });
      }

      if (sub === 'create') {
        await interaction.deferReply();
        const prize = options.getString('prize', true);
        const winnersCount = Math.max(1, Math.min(20, options.getInteger('winners', true)));
        const durationRaw = options.getString('duration');
        const entriesGoal = options.getInteger('entries_goal');
        const memberGoal = options.getInteger('member_goal');
        const note = options.getString('note');

        const durMs = durationRaw ? parseDuration(durationRaw) : null;
        const hasGoal = (typeof entriesGoal === 'number' && entriesGoal > 0) || (typeof memberGoal === 'number' && memberGoal > 0);
        if (!durMs && !hasGoal) {
          return interaction.editReply('❌ Provide either a duration (e.g. `30m`, `1h`) or at least one goal (`entries_goal` / `member_goal`).');
        }

        const endTime = durMs ? (Date.now() + durMs) : null;
        const gId = generateId();

        const endsBits = [];
        if (endTime) endsBits.push(`${tsR(endTime)} (${ts(endTime)})`);
        if (memberGoal) endsBits.push(`${memberGoal} members`);
        if (entriesGoal) endsBits.push(`${entriesGoal} entries`);
        const baseDesc = [
          `Ends: ${endsBits.length ? endsBits.join(' • ') : 'When goals are met'}`,
          `Hosted by: <@${interaction.user.id}>`,
          note ? `${note}` : null,
          `Entries: **0**`,
          `Winners: **${winnersCount}**`
        ].filter(Boolean).join('\n');

        const embed = new EmbedBuilder()
          .setTitle(`${prize}`)
          .setDescription(baseDesc)
          .setColor(0x5865f2)
          .setFooter({ text: `ID: ${gId}` });

        const row = new ActionRowBuilder().addComponents(
          // Blue button, emoji-only
          new ButtonBuilder().setCustomId('giveaway_join').setStyle(ButtonStyle.Primary).setEmoji('🎉')
        );

        const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

        await store.createGiveaway({
          id: gId,
          guildId: interaction.guildId,
          channelId: interaction.channelId,
          messageId: msg.id,
          prize,
          winnersCount,
          hostId: interaction.user.id,
          entries: [],
          endTime,
          entriesGoal: entriesGoal || null,
          memberGoal: memberGoal || null,
          createdAt: Date.now(),
          ended: false
        });

        // No visible confirmation message
        await interaction.deleteReply().catch(() => {});
        return;
      }

      if (sub === 'end') {
        await interaction.deferReply();
        const messageId = options.getString('message_id', true);
        const g = await store.getGiveaway(messageId);
        if (!g) return interaction.editReply('❌ Giveaway not found for that message ID.');
        if (g.ended) return interaction.editReply('That giveaway is already ended.');
        await store.endGiveaway(messageId);
        const ch = await client.channels.fetch(g.channelId);
        const m = await ch.messages.fetch(g.messageId);
        await endGiveawayLogic(g, ch, m);
        await interaction.deleteReply().catch(() => {});
        return;
      }
      if (sub === 'edit') {
        await promptStickyEditDropdown(interaction);
        return;
      }
      if (sub === 'delete') {
        await interaction.deferReply();
        const messageId = options.getString('message_id', true);
        const g = await store.getGiveaway(messageId);
        if (!g) return interaction.editReply('❌ Giveaway not found for that message ID.');
        await store.deleteGiveaway(messageId);
        try {
          const ch = await client.channels.fetch(g.channelId);
          const m = await ch.messages.fetch(g.messageId);
          await m.delete().catch(() => {});
        } catch {}
        await interaction.deleteReply().catch(() => {});
        return;
      }

      if (sub === 'reroll') {
        await interaction.deferReply();
        const messageId = options.getString('message_id');
        const g = messageId ? await store.getGiveaway(messageId) : await store.getLastEndedGiveaway(interaction.guildId);
        if (!g) return interaction.editReply('❌ No ended giveaways found (or message ID not found).');
        if (!g.entries || g.entries.length === 0) return interaction.editReply('No entries to reroll.');

        const unique = [...new Set(g.entries)];
        const pick = unique[Math.floor(Math.random() * unique.length)];

        // Update original giveaway message + announce publicly
        try {
          const ch = await client.channels.fetch(g.channelId).catch(() => null);
          if (ch) {
            const msg = await ch.messages.fetch(g.messageId).catch(() => null);
            if (msg) {
              // Delete prior announce message if we tracked it
              if (g.lastAnnounceMessageId) {
                const prev = await ch.messages.fetch(g.lastAnnounceMessageId).catch(() => null);
                if (prev) await prev.delete().catch(() => {});
              }

              const embeds = msg.embeds || [];
              if (embeds.length > 0) {
                const base = EmbedBuilder.from(embeds[0]);
                let desc = base.data?.description || '';
                // Replace (not append) winner info for easy readability.
                // 1) Remove any prior reroll lines
                desc = desc.replace(/^Rerolled:.*\n?/gmi, '');
                desc = desc.replace(/^🔁\s*\*\*Rerolled Winner:\*\*.*\n?/gmi, '');
                // 2) Replace the Winners line if present; otherwise add one.
                if (/^Winners:\s*/im.test(desc)) {
                  desc = desc.replace(/^Winners:.*$/gmi, `Winners: <@${pick}>`);
                } else {
                  desc = `${desc.trim()}\nWinners: <@${pick}>`;
                }
                // 3) Add a single reroll stamp
                desc = `${desc.trim()}\nRerolled: ${tsR(Date.now())} (${ts(Date.now())})`;
                base.setDescription(desc);
                await msg.edit({ embeds: [base] }).catch(() => {});
              } else {
                await msg.edit({ content: `🔁 **Rerolled Winner:** <@${pick}> — **${g.prize}**` }).catch(() => {});
              }

              const ann = await msg.reply({ content: `🎉 Congratulations <@${pick}>, you won **${g.prize}**!` }).catch(() => null);
              if (ann) await store.updateGiveaway(g.messageId, { lastAnnounceMessageId: ann.id }).catch(() => {});
            }
          }
        } catch (e) {
          console.error('reroll edit/announce error:', e);
        }

        // No ephemeral confirmation message; keep chat clean.
        await interaction.deleteReply().catch(() => {});
        return;
      }

    }

    // --- AFK ---
    if (commandName === 'afk') {
      const reason = (options.getString('reason') || '').trim();
      await interaction.deferReply({ flags: 64 }).catch(() => {});

      // Set AFK state
      await store.setAfk(interaction.guildId, interaction.user.id, reason).catch(() => {});

      // Update nickname to put [AFK] at the very beginning
      const member = interaction.member;
      if (member && member.guild) {
        await syncNickname(member).catch(() => {});
      }

      // Send a public embed in the channel, delete after 30s
      const afkEmbed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setDescription(`${interaction.user} is now AFK${reason ? `: ${reason}` : '.'}`);
      const pub = await interaction.channel.send({ embeds: [afkEmbed] }).catch(() => null);
      if (pub) setTimeout(() => pub.delete().catch(() => {}), 30000);

      return interaction.editReply('AFK set.');
    }

    // --- EMBED SEARCH ---
    if (commandName === 'search') {
      const sub = options.getSubcommand(false);
      if (sub === 'embeds') {
        await interaction.deferReply({ flags: 64 });

        const query = options.getString('query', true).trim();
        const targetChannel = options.getChannel('channel') || interaction.channel;
        const scanLimit = Math.min(options.getInteger('limit') || 500, 2000);

        if (!targetChannel?.isTextBased()) {
          return interaction.editReply('❌ That channel is not a text channel.');
        }

        // Check if query looks like a user mention
        const mentionMatch = query.match(/^<@!?(\d+)>$/) || query.match(/^(\d{16,20})$/);
        const searchUserId = mentionMatch ? mentionMatch[1] : null;
        const searchText = query.toLowerCase();

        const matches = [];
        let lastId = null;
        let scanned = 0;

        while (scanned < scanLimit) {
          const batch = await targetChannel.messages.fetch({
            limit: Math.min(100, scanLimit - scanned),
            before: lastId || undefined,
          }).catch(() => null);

          if (!batch || batch.size === 0) break;

          for (const msg of batch.values()) {
            for (const embed of (msg.embeds || [])) {
              let hit = false;
              const embedText = [
                embed.title, embed.description, embed.footer?.text,
                ...(embed.fields || []).map(f => `${f.name} ${f.value}`),
                embed.author?.name,
              ].filter(Boolean).join(' ').toLowerCase();

              if (searchUserId) {
                // Search for user ID in description, fields, and raw content
                const fullText = embedText + ' ' + (msg.content || '').toLowerCase();
                if (fullText.includes(searchUserId)) hit = true;
                // Also check if the message mentions the user
                if (msg.mentions?.users?.has(searchUserId)) hit = true;
              } else {
                if (embedText.includes(searchText)) hit = true;
              }

              if (hit) {
                matches.push({
                  url: msg.url,
                  title: embed.title || embed.description?.slice(0, 60) || '(embed)',
                  timestamp: msg.createdTimestamp,
                });
                break; // one match per message is enough
              }
            }

            // Also check raw message content for user ID searches
            if (searchUserId && !matches.find(m => m.url === msg.url)) {
              if ((msg.content || '').includes(searchUserId)) {
                matches.push({
                  url: msg.url,
                  title: msg.content.slice(0, 60) || '(message)',
                  timestamp: msg.createdTimestamp,
                });
              }
            }
          }

          scanned += batch.size;
          lastId = batch.last()?.id;
          if (batch.size < 100) break;
        }

        if (!matches.length) {
          return interaction.editReply(`No embeds found matching **${query}** in ${targetChannel} (scanned ${scanned} messages).`);
        }

        // Show results newest first, max 15 links
        matches.sort((a, b) => b.timestamp - a.timestamp);
        const shown = matches.slice(0, 15);
        const lines = shown.map((m, i) => `**${i + 1}.** [${m.title.replace(/\n/g, ' ').slice(0, 80)}](${m.url})`);
        const extra = matches.length > 15 ? `\n*…and ${matches.length - 15} more (narrow your search or increase scan limit)*` : '';

        const eb = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(`Search results for "${query}"`)
          .setDescription(lines.join('\n') + extra)
          .setFooter({ text: `${matches.length} match${matches.length !== 1 ? 'es' : ''} · scanned ${scanned} messages in #${targetChannel.name}` });

        return interaction.editReply({ embeds: [eb] });
      }
    }


    // /staffstats handler removed — use /leaderboard staff.

    // --- LEADERBOARD ---
    // --- LEADERBOARD (consolidated; replaces /mod lb and /build lb) ---
    if (commandName === 'leaderboard') {
      const type = options.getString('type', true);
      await interaction.deferReply().catch(() => {});
      const cfg = await store.getTicketConfig().catch(() => ({}));
      if (!isStaffMember(interaction.member, cfg) && !interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator)) {
        return safeIReply(interaction, { content: 'Staff only.', flags: 64 });
      }

      if (type === 'staff') {
        const stats = await store.getTicketStats(interaction.guildId).catch(() => ({}));
        const rows = [];
        for (const [staffId, s] of Object.entries(stats || {})) {
          const member = await interaction.guild.members.fetch(staffId).catch(() => null);
          if (!member) continue;
          if (!isStaffMember(member, cfg) && !member.permissions?.has?.(PermissionsBitField.Flags.Administrator)) continue;
          const closed = Number(s.closed || 0);
          const renamed = Number(s.renameCount || 0);
          const messages = Number(s.messageCount || 0);
          const rc = Number(s.responseCount || 0);
          const avgMs = rc > 0 ? Math.round(Number(s.responseTotalMs || 0) / rc) : null;
          rows.push({ staffId, closed, renamed, messages, avgMs, rc });
        }
        rows.sort((a,b) => (b.closed - a.closed) || (b.renamed - a.renamed) || (b.messages - a.messages) || ((a.avgMs ?? 9e18) - (b.avgMs ?? 9e18)));
        const sessionId = generateId();
        const totalPages = Math.max(1, Math.ceil(rows.length / 10));
        statsPanelSessions.set(sessionId, { kind: 'staff', userId: interaction.user.id, page: 0, rows, createdAt: Date.now() });
        const eb = renderStaffStatsEmbed(rows, 0, totalPages);
        return safeIReply(interaction, { embeds: [eb], components: statsNavRow('staff', sessionId, 0, totalPages) });
      }

      if (type === 'builder') {
        const countsById = await store.getBuilderFinishedCountsById(interaction.guildId).catch(() => ({}));
        const records = await store.listBuildRecords(interaction.guildId).catch(() => []);
        const totals = (await Promise.all(Object.entries(countsById).map(async ([discordId, finished]) => {
          const member = await interaction.guild.members.fetch(discordId).catch(() => null);
          if (!member || !isBuilderMember(member)) return null;
          const mineRecords = records.filter(r => String(r.builderDiscordId || '') === String(discordId));
          const earned = mineRecords.reduce((a, r) => a + Number(r.price ?? r.amount ?? 0), 0);
          const displayName = member.displayName || member.user?.username || await resolveGuildDisplayName(interaction.guild, discordId);
          return { discordId, displayName, finished: Number(finished || 0), earned };
        }))).filter(Boolean).sort((a, b) => (b.finished - a.finished) || (b.earned - a.earned));
        const sessionId = generateId();
        const totalPages = Math.max(1, Math.ceil(totals.length / 10));
        statsPanelSessions.set(sessionId, { kind: 'builder', userId: interaction.user.id, page: 0, rows: totals, createdAt: Date.now() });
        const eb = renderBuilderStatsEmbed(totals, 0, totalPages);
        return safeIReply(interaction, { embeds: [eb], components: statsNavRow('builder', sessionId, 0, totalPages) });
      }

      return safeIReply(interaction, { content: '❌ Unknown leaderboard type.', flags: 64 });
    }

    if (commandName === 'stats') {
      await interaction.deferReply().catch(() => {});
      const cfg = await store.getTicketConfig().catch(() => ({}));
      if (!isStaffMember(interaction.member, cfg) && !interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator)) {
        return safeIReply(interaction, { content: 'Staff only.', flags: 64 });
      }
      const targetUser = options.getUser('staff') || interaction.user;
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      const stats = await store.getTicketStats(interaction.guildId).catch(() => ({}));
      const s = stats?.[targetUser.id] || {};
      const records = await store.listBuildRecordsByDiscord(interaction.guildId, targetUser.id).catch(() => []);
      const jobs = await store.listBuildJobs(interaction.guildId).catch(() => []);
      const mine = (jobs || []).filter(j => String(j.builderDiscordId || '') === String(targetUser.id));
      const staffRole = targetMember ? isStaffMember(targetMember, cfg) || targetMember.permissions?.has?.(PermissionsBitField.Flags.Administrator) : false;
      const builderRole = targetMember ? isBuilderMember(targetMember) : false;
      const rc = Number(s.responseCount || 0);
      const avgMs = rc > 0 ? Math.round(Number(s.responseTotalMs || 0) / rc) : null;
      const fmtMs = (ms) => { if (ms == null) return '—'; const sec = Math.max(0, Math.round(ms / 1000)); const m = Math.floor(sec / 60); const secRem = sec % 60; return `${m}m ${String(secRem).padStart(2,'0')}s`; };
      const finished = records.length;
      const volume = records.reduce((a,r)=>a+Number(r.price ?? r.amount ?? 0),0);
      const builderIgn = records.find(r => r.builderIgn)?.builderIgn || mine.find(j => j.builderIgn)?.builderIgn || null;
      const displayName = targetMember?.displayName || targetUser.username;
      const eb = new EmbedBuilder()
        .setColor(0x00A8FF)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(`@${displayName}'s overall activity.`)
        .setTimestamp();
      if (staffRole || Number(s.closed || 0) || Number(s.renameCount || 0) || Number(s.messageCount || 0) || rc) {
        eb.addFields({ name: 'Staff History', value: `> **Closed Tickets:** \`${Number(s.closed || 0)}\`\n> **Tickets Renamed:** \`${Number(s.renameCount || 0)}\`\n> **Total Messages:** \`${Number(s.messageCount || 0)}\`\n> **Avg Response:** \`${fmtMs(avgMs)}\``, inline: false });
      }
      if (builderRole || finished || volume) {
        let text = `> **Orders Finished:** \`${finished}\`\n> **Total Revenue:** \`${money(volume)}\``;
        if (builderIgn) text += `\n> **Builder IGN:** \`${builderIgn}\``;
        eb.addFields({ name: 'Builder History', value: text, inline: false });
      }
      if (!eb.data.fields?.length) eb.setDescription(`${targetUser} has no recorded staff or builder history.`);
      return interaction.editReply({ embeds: [eb] });
    }

    if (commandName === 'stafflist') {
      await interaction.deferReply({ flags: 64 }).catch(() => {});
      if (!canManageStaffList(interaction.member)) {
        return interaction.editReply('Managers only.');
      }

      const sub = options.getSubcommand(false);
      if (sub === 'edit') {
        const targetUser = options.getUser('person', true);
        const kind = options.getString('type', true) === 'builder' ? 'builder' : 'support';
        const ignRaw = options.getString('ign', false);
        const altsRaw = options.getString('alts', false);
        if (ignRaw == null && altsRaw == null) {
          return interaction.editReply('Provide `ign`, `alts`, or both.');
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) return interaction.editReply('That member is not in this server.');

        const roleSets = await getAcceptedInfoRoleSets(interaction.guild).catch(() => null);
        const requiredRoleIds = kind === 'builder' ? roleSets?.builderRoleIds : roleSets?.supportRoleIds;
        const hasMatchingRole = targetMember.roles.cache.some(r => (requiredRoleIds || []).includes(r.id));
        if (!hasMatchingRole) {
          return interaction.editReply(`That member does not have a ${staffListTitle(kind).toLowerCase()} role.`);
        }

        const data = await store.getAcceptedStaffList().catch(() => null);
        const key = kind === 'builder' ? 'builders' : 'support';
        const existing = data?.[key]?.[targetUser.id] || {};
        const ign = ignRaw == null
          ? String(existing.ign || '').trim()
          : sanitizeDisplayName(ignRaw, { maxLen: 16 });
        if (!ign) return interaction.editReply('Main IGN is required for a new staff-list entry.');

        const alts = altsRaw == null
          ? (Array.isArray(existing.alts) ? existing.alts : [])
          : normalizeStaffListAltsInput(altsRaw, s => sanitizeDisplayName(s, { maxLen: 16 }));

        await store.setAcceptedStaffListEntry(kind, targetUser.id, {
          userId: targetUser.id,
          ign,
          alts,
          appId: existing.appId || null,
          acceptedById: existing.acceptedById || interaction.user.id,
          acceptedAt: existing.acceptedAt || Date.now(),
          infoRequestedAt: existing.infoRequestedAt || Date.now(),
        });
        await refreshAcceptedStaffList(kind).catch(() => {});

        const altText = alts.length ? alts.map(a => `\`${a}\``).join(', ') : 'None';
        const eb = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Staff List Updated')
          .setDescription(`${targetUser} in **${staffListTitle(kind)}**`)
          .addFields(
            { name: 'IGN', value: `\`${ign}\``, inline: true },
            { name: 'Alts', value: altText.slice(0, 1024), inline: false },
          );
        return interaction.editReply({ embeds: [eb] });
      }
    }

    // --- BUILDER: availability board ---

    // --- SUGGESTION ---
    if (commandName === 'suggestion') {
      await interaction.deferReply({ flags: 64 }).catch(() => {});
      const suggestion = (options.getString('suggestion', true) || '').trim();
      const targetId = C.CHANNEL_SUGGESTIONS || await store.getConfigValue(interaction.guildId, 'CHANNEL_SUGGESTIONS').catch(() => null);
      const targetCh = targetId ? await interaction.guild.channels.fetch(targetId).catch(() => null) : interaction.channel;
      if (!targetCh?.isTextBased?.()) return interaction.editReply('❌ Suggestions channel is not configured.');
      const embed = new EmbedBuilder().setColor(0x2b2d31).setTitle('Suggestion').setDescription(suggestion.slice(0,4000)).addFields({ name: 'Submitted by', value: `<@${interaction.user.id}>`, inline: true }).setTimestamp();
      const msg = await targetCh.send({ embeds: [embed] }).catch(() => null);
      if (msg) { await msg.react('⬆️').catch(() => {}); await msg.react('⬇️').catch(() => {}); }
      return interaction.editReply(`✅ Suggestion submitted${targetCh.id !== interaction.channelId ? ` in <#${targetCh.id}>` : '.'}`);
    }

    // --- LITEMATIC RENDER ---
    if (commandName === 'render') {
      await handleRenderCommand(interaction, {
        renderLitematic: (buf, opts) => getLitematicRender().renderLitematic(buf, opts),
      });
      return;
    }

    // --- SERVER INFO ---
    if (commandName === 'serverinfo') {
      await interaction.deferReply();
      const g = interaction.guild;
      if (!g) return interaction.editReply('This command can only be used in a server.');

      let ownerDisplay = g.ownerId ? `<@${g.ownerId}>` : 'Unknown';
      try {
        const ownerUser = g.ownerId ? await interaction.client.users.fetch(g.ownerId) : null;
        if (ownerUser) ownerDisplay = `${ownerUser.tag} (${ownerDisplay})`;
      } catch {}

      const created = g.createdTimestamp ? `${tsR(g.createdTimestamp)} (${ts(g.createdTimestamp)})` : 'Unknown';
      const boosts = `Level ${g.premiumTier || 0} • ${g.premiumSubscriptionCount || 0} boosts`;
      const icon = g.iconURL({ size: 256 });
      const banner = g.bannerURL({ size: 512 });
      const roleCount = g.roles?.cache?.size || 0;
      const channelCount = g.channels?.cache?.size || 0;
      const emojis = g.emojis?.cache?.size || 0;
      const eb = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setAuthor({ name: g.name, iconURL: icon || undefined })
        .setThumbnail(icon)
        .setDescription(`${E_MEMBER} **${Number(g.memberCount || 0).toLocaleString('en-US')}** members
${E_TIME} Created ${created}`)
        .addFields(
          { name: `${E_INFO} Owner`, value: ownerDisplay, inline: false },
          { name: `${E_STATUS} Channels`, value: `**${channelCount.toLocaleString('en-US')}**`, inline: true },
          { name: `${E_BUILD} Roles`, value: `**${roleCount.toLocaleString('en-US')}**`, inline: true },
          { name: `${E_VERIFY} Boosts`, value: boosts, inline: true },
          { name: `${E_FARM} Emojis`, value: `**${emojis.toLocaleString('en-US')}**`, inline: true },
          { name: `${E_INFO} Server ID`, value: `\`${g.id}\``, inline: true },
        )
        .setFooter({ text: `${g.name} • Server Info` })
        .setTimestamp();
      if (banner) eb.setImage(banner);
      return interaction.editReply({ embeds: [eb] });
    }

    if (commandName === 'sticky') {
      const sub = options.getSubcommand();
      if (sub === 'create') {
        const modal = new ModalBuilder().setCustomId('sticky_create_modal').setTitle('Create Sticky Message');
        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sticky_content').setLabel('Message Text (Optional)').setStyle(TextInputStyle.Paragraph).setRequired(false)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sticky_embed_title').setLabel('Embed Title (Optional)').setStyle(TextInputStyle.Short).setRequired(false)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sticky_embed_desc').setLabel('Embed Description (Optional)').setStyle(TextInputStyle.Paragraph).setRequired(false)), new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sticky_embed_color').setLabel('Embed Color (Hex)').setStyle(TextInputStyle.Short).setRequired(false)));
        await interaction.showModal(modal); return;
      }
      if (sub === 'delete') {
        await interaction.deferReply({ flags: 64 });
        await store.clearStickies(interaction.channelId); // Clears ALL stickies for simplicity
        await interaction.editReply('✅ All sticky messages cleared from this channel.'); return;
      }
    }
    if (commandName === 'embed') {
      const sub = options.getSubcommand();
      if (sub === 'create') {
        const select = new StringSelectMenuBuilder()
          .setCustomId('create_embed_color')
          .setPlaceholder('Select a Color')
          .addOptions(
            { label: 'Red', value: 'Red', emoji: '🔴' },
            { label: 'Blue', value: 'Blue', emoji: '🔵' },
            { label: 'Green', value: 'Green', emoji: '🟢' },
            { label: 'Yellow', value: 'Yellow', emoji: '🟡' },
            { label: 'Purple', value: 'Purple', emoji: '🟣' },
            { label: 'Orange', value: 'Orange', emoji: '🟠' },
            { label: 'White', value: 'White', emoji: '⚪' },
            { label: 'Black', value: '#000000', emoji: '⚫' },
            { label: 'Dark Grey', value: '#2b2d31', emoji: '🌑' }
          );
        await interaction.reply({ content: 'Choose an embed color:', components: [new ActionRowBuilder().addComponents(select)], flags: 64 });
        return;
      }
      if (sub === 'edit') {
        await promptEmbedEditDropdown(interaction);
        return;
      }
    }

    

    // --- TICKET PANELS ---
    if (commandName === "panel") {
      const sub = interaction.options.getSubcommand();
      if (sub === "list") {
        await interaction.deferReply({ flags: 64 });
        const panels = await store.listTicketPanels();
        const ids = [...Object.keys(panels || {}), 'spawner_prices'];
        return interaction.editReply(ids.length ? `Panels: ${ids.map(x=>`\`${x}\``).join(", ")}` : "No panels configured.");
      }
      if (sub === "send") {
        await interaction.deferReply({ flags: 64 });
        const panelId = interaction.options.getString("type", true);

        // Spawner prices panel is published through its own helper so the
        // panel-ref + price embed both update consistently.
        if (panelId === 'spawner_prices') {
          const res = await refreshSpawnerPricesPanel(interaction.guild);
          if (!res) return interaction.editReply(`❌ Could not publish panel in <#${SPAWNER_PRICES_CHANNEL_ID}>.`);
          return interaction.editReply(`✅ Spawner prices panel refreshed in <#${res.channel.id}>.`);
        }

        const panel = await store.getTicketPanel(panelId);
        if (!panel) return interaction.editReply("Panel not found. Run the bot and try again — panels are loaded from data.json.");

        const embed = new EmbedBuilder()
          .setTitle(panel.embed?.title || panel.id)
          .setDescription(panel.embed?.description || "")
          .setColor(typeof panel.embed?.color === 'number'
            ? panel.embed.color
            : ticketColor(panel.embed?.colorName || "Blue"));

        const rows = [];
        const components = Array.isArray(panel.components) ? panel.components : [];

        for (const rowDef of components) {
          const ar = new ActionRowBuilder();
          for (const c of (rowDef || [])) {
            if (c.type === "button") {
              // Building services uses the build queue, all others open a ticket modal
              const customId = c.useQueue
                ? `bq_open:${c.key}`
                : `tk_open:${panel.id}:${c.key}`;
              const b = new ButtonBuilder()
                .setCustomId(customId)
                .setLabel(c.label)
                .setStyle(ButtonStyle.Secondary);  // always gray
              if (c.emoji) { try { b.setEmoji(c.emoji); } catch {} }
              ar.addComponents(b);
            } else if (c.type === "app") {
              const isClosed = await store.getAppClosed(c.appTypeId).catch(() => false);
              const b = new ButtonBuilder()
                .setCustomId(`app_start:${c.appTypeId}`)
                .setLabel(isClosed ? `${c.label} — Closed` : c.label)
                .setStyle(ButtonStyle.Secondary)  // always gray
                .setDisabled(!!isClosed);
              if (c.emoji) { try { b.setEmoji(c.emoji); } catch {} }
              ar.addComponents(b);
            } else if (c.type === "dropdown") {
              const dp = await store.getDropdownPanel(c.dropdownId);
              if (!dp) continue;
              const opts = Object.entries(dp.options || {}).slice(0, 25).map(([k, v]) => ({
                label: v.label?.slice(0, 100) || k,
                value: `${c.dropdownId}|${k}`,
                emoji: v.emoji || undefined,
              }));
              const sel = new StringSelectMenuBuilder()
                .setCustomId(`dd_use:${c.dropdownId}`)
                .setPlaceholder(dp.placeholder || "Select...")
                .addOptions(opts);
              rows.push(new ActionRowBuilder().addComponents(sel));
            }
          }
          if (ar.components.length) rows.push(ar);
        }

        const sent = await interaction.channel.send({ embeds: [embed], components: rows });
        // Track the published panel message so /application can edit it later.
        try {
          await store.setTicketPanelRef(panel.id, { channelId: sent.channelId, messageId: sent.id });
        } catch {}
        return interaction.editReply("Panel sent.");
      }
    }

    // --- SPAWNER PRICES MANAGEMENT ---
    if (commandName === 'spawner') {
      await interaction.deferReply({ flags: 64 }).catch(() => {});
      // Allow-list: the owner user id + anyone with Admin or Manager role
      // (or Discord Administrator perm).
      const SPAWNER_COMMAND_OWNER_ID = '508574921010577409';
      const memberRoles = interaction.member?.roles?.cache;
      const hasAdminOrManagerRole = !!(memberRoles && (
        (C.ROLE_ADMIN   && memberRoles.has(C.ROLE_ADMIN))   ||
        (C.ROLE_MANAGER && memberRoles.has(C.ROLE_MANAGER))
      ));
      const hasDiscordAdmin = interaction.member?.permissions?.has?.(PermissionsBitField.Flags.Administrator);
      if (
        interaction.user.id !== SPAWNER_COMMAND_OWNER_ID &&
        !hasAdminOrManagerRole &&
        !hasDiscordAdmin
      ) {
        return safeIReply(interaction, { content: 'Admin or Manager only.', flags: 64 });
      }
      const sub = options.getSubcommand();
      // /spawner panel has been folded into /panel send spawner_prices.

      if (sub === 'buy' || sub === 'sell') {
        const typeKey = options.getString('type', true);
        const priceRaw = options.getString('price', true);
        const type = getSpawnerType(typeKey);
        if (!type) return interaction.editReply('❌ Unknown spawner type.');
        const price = parseSpawnerPrice(priceRaw);
        if (!price || price <= 0) return interaction.editReply('❌ Price must be a positive number (e.g. `4.1m`, `530000`).');
        await store.setSpawnerPrice(type.key, sub, price).catch(() => {});
        await refreshSpawnerPricesPanel(interaction.guild).catch(() => {});
        return interaction.editReply(`✅ Set **${type.label}** ${sub.toUpperCase()} price to **${fmtSpawnerPrice(price)}** each.`);
      }

      if (sub === 'remove') {
        const action = options.getString('action', true);
        const typeKey = options.getString('type', true);
        const type = getSpawnerType(typeKey);
        if (!type) return interaction.editReply('❌ Unknown spawner type.');
        if (!['buy','sell'].includes(action)) return interaction.editReply('❌ Action must be Buy or Sell.');
        await store.clearSpawnerPrice(type.key, action).catch(() => {});
        await refreshSpawnerPricesPanel(interaction.guild).catch(() => {});
        return interaction.editReply(`✅ Cleared **${type.label}** ${action.toUpperCase()} price.`);
      }
    }

    // --- PUBLISH (schematic submission) ---
    if (commandName === 'publish') {
      // Do NOT defer up front — `import` shows a modal (must be the first
      // response). Other subcommands defer themselves below.
      const channel = interaction.channel;
      if (!channel || !isPublishSchematicTicketChannel(channel)) {
        return interaction.reply({ content: 'Run this inside a Publish Schematic ticket.', flags: 64 }).catch(() => {});
      }
      const sub = await store.findSchematicSubmissionByTicketChannel(channel.id).catch(() => null);
      if (!sub) {
        return interaction.reply({ content: 'No submission record for this ticket. Click **Start Submission** first.', flags: 64 }).catch(() => {});
      }
      const isOwner = String(interaction.user.id) === String(sub.submitterId);
      const isManager = canManageSchematicSubmission(interaction.member);
      if (!isOwner && !isManager) {
        return interaction.reply({ content: 'Only the submitter or a schematic manager can use /publish here.', flags: 64 }).catch(() => {});
      }
      const sub_action = options.getSubcommand();

      await interaction.deferReply({ flags: 64 }).catch(() => {});

      if (sub_action === 'render') {
        const result = await regenerateSchematicRender(channel, sub);
        if (!result.ok) return safeIReply(interaction, { content: `❌ ${result.reason}`, flags: 64 });
        return safeIReply(interaction, { content: '✅ Re-rendered.', flags: 64 });
      }

      if (sub_action === 'image') {
        const att = options.getAttachment('attachment', true);
        if (!/\.(png|jpe?g|webp)$/i.test(att.name || att.url || '')) {
          return safeIReply(interaction, { content: '❌ Image must be PNG, JPG, or WEBP.', flags: 64 });
        }
        // Re-host the image as a fresh attachment in the ticket so the forum
        // post can pull a stable URL on /publish post.
        try {
          const buf = await downloadToBuffer(att.url);
          const hosted = await channel.send({
            files: [new AttachmentBuilder(buf, { name: att.name || 'render.png' })],
          }).catch(() => null);
          const renderUrl = hosted?.attachments?.first()?.url || null;
          if (!renderUrl) {
            return safeIReply(interaction, { content: '❌ Failed to host the override image.', flags: 64 });
          }
          await store.updateSchematicSubmission(sub.id, {
            renderUrl,
            renderMessageId: hosted.id,
            updatedAt: Date.now(),
          }).catch(() => {});
          const fresh = await store.getSchematicSubmission(sub.id).catch(() => sub);
          await postOrUpdateSchematicDraftPreview(channel, fresh).catch(() => {});
          return safeIReply(interaction, { content: '✅ Image override applied.', flags: 64 });
        } catch (e) {
          return safeIReply(interaction, { content: `❌ Image override failed: ${e?.message || e}`, flags: 64 });
        }
      }

      if (sub_action === 'post') {
        if (!isManager) {
          return safeIReply(interaction, { content: 'Schematic manager only.', flags: 64 });
        }
        const missing = [];
        if (!sub.name)         missing.push('name');
        if (!sub.designers || !parseDesignerLines(sub.designers).length) missing.push('designers');
        if (!sub.howto)        missing.push('how-to-use');
        if (!sub.renderUrl)    missing.push('render');
        if (!sub.litematicUrl) missing.push('.litematic');
        if (missing.length) {
          return safeIReply(interaction, { content: `❌ Cannot publish — missing: ${missing.join(', ')}.`, flags: 64 });
        }
        const res = await publishOrUpdateSchematicForumPost(interaction.guild, sub);
        if (!res.ok) return safeIReply(interaction, { content: `❌ ${res.reason}`, flags: 64 });
        const verb = res.updated ? 'Updated' : 'Published';
        await channel.send({
          embeds: [new EmbedBuilder().setColor(0x08a4a7).setTitle(verb).setDescription(`This schematic has been ${verb.toLowerCase()} in <#${res.thread.id}>.`)],
        }).catch(() => {});
        const fresh = await store.getSchematicSubmission(sub.id).catch(() => sub);
        await postOrUpdateSchematicDraftPreview(channel, fresh).catch(() => {});
        return safeIReply(interaction, { content: `✅ ${verb} → <#${res.thread.id}>`, flags: 64 });
      }

      if (sub_action === 'unpost') {
        if (!isManager) {
          return safeIReply(interaction, { content: 'Schematic manager only.', flags: 64 });
        }
        const res = await retireSchematicForumPost(interaction.guild, sub);
        if (!res.ok) return safeIReply(interaction, { content: `❌ ${res.reason}`, flags: 64 });
        await channel.send({
          embeds: [new EmbedBuilder().setColor(0xed4245).setTitle('Unposted').setDescription('Forum thread deleted. Submission reset to DRAFT.')],
        }).catch(() => {});
        const fresh = await store.getSchematicSubmission(sub.id).catch(() => sub);
        await postOrUpdateSchematicDraftPreview(channel, fresh).catch(() => {});
        return safeIReply(interaction, { content: '✅ Forum thread removed; submission reset to DRAFT.', flags: 64 });
      }

      if (sub_action === 'reject') {
        if (!isManager) {
          return safeIReply(interaction, { content: 'Schematic manager only.', flags: 64 });
        }
        const reason = (options.getString('reason', true) || '').trim();
        await store.updateSchematicSubmission(sub.id, {
          status: 'REJECTED',
          rejectedById: interaction.user.id,
          rejectedAt: Date.now(),
          rejectionReason: reason,
          updatedAt: Date.now(),
        }).catch(() => {});

        // DM submitter
        try {
          const user = await interaction.client.users.fetch(sub.submitterId).catch(() => null);
          if (user) {
            const dm = await user.createDM().catch(() => null);
            if (dm) {
              await dm.send({
                embeds: [new EmbedBuilder()
                  .setColor(0xed4245)
                  .setTitle('Schematic Submission Rejected')
                  .setDescription(`Your schematic submission${sub.name ? ` **${sub.name}**` : ''} was rejected by ${interaction.user}.`)
                  .addFields({ name: 'Reason', value: reason.slice(0, 1024) || '—' })],
              }).catch(() => {});
            }
          }
        } catch {}

        // Public notice in ticket
        await channel.send({
          content: sub.submitterId ? `<@${sub.submitterId}>` : '',
          allowedMentions: sub.submitterId ? { users: [sub.submitterId] } : { parse: [] },
          embeds: [new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle('Submission Rejected')
            .setDescription(`Rejected by ${interaction.user}.`)
            .addFields({ name: 'Reason', value: reason.slice(0, 1024) || '—' })],
        }).catch(() => {});

        return safeIReply(interaction, { content: '✅ Rejection logged. You can `/ticket close` when ready.', flags: 64 });
      }
    }

    // --- APPLICATION OPEN/CLOSE ---
    if (commandName === 'application') {
      await interaction.deferReply({ flags: 64 }).catch(() => {});
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
          && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return safeIReply(interaction, { content: 'Manage Server only.', flags: 64 });
      }
      const typeId = options.getString('type', true);
      const state  = options.getString('state', true);
      if (!['builder','staff'].includes(typeId)) return interaction.editReply('❌ Unknown application type.');
      if (!['open','close'].includes(state))    return interaction.editReply('❌ State must be open or close.');
      const closed = state === 'close';
      await store.setAppClosed(typeId, closed).catch(() => {});

      // Re-render the published applications panel, if any.
      let panelEdited = false;
      try {
        const ref = await store.getTicketPanelRef('applications').catch(() => null);
        if (ref?.channelId && ref?.messageId) {
          const ch = await interaction.guild.channels.fetch(ref.channelId).catch(() => null);
          const msg = ch ? await ch.messages.fetch(ref.messageId).catch(() => null) : null;
          if (msg) {
            const panel = await store.getTicketPanel('applications').catch(() => null);
            if (panel) {
              const embed = new EmbedBuilder()
                .setTitle(panel.embed?.title || 'Applications')
                .setDescription(panel.embed?.description || '')
                .setColor(typeof panel.embed?.color === 'number'
                  ? panel.embed.color
                  : ticketColor(panel.embed?.colorName || 'Green'));
              const rows = [];
              const closedMap = await store.listAppClosed().catch(() => ({}));
              for (const rowDef of (panel.components || [])) {
                const ar = new ActionRowBuilder();
                for (const c of (rowDef || [])) {
                  if (c.type === 'app') {
                    const isClosed = !!closedMap[c.appTypeId];
                    const b = new ButtonBuilder()
                      .setCustomId(`app_start:${c.appTypeId}`)
                      .setLabel(isClosed ? `${c.label} — Closed` : c.label)
                      .setStyle(ButtonStyle.Secondary)
                      .setDisabled(isClosed);
                    if (c.emoji) { try { b.setEmoji(c.emoji); } catch {} }
                    ar.addComponents(b);
                  } else if (c.type === 'button') {
                    const b = new ButtonBuilder()
                      .setCustomId(`tk_open:${panel.id}:${c.key}`)
                      .setLabel(c.label)
                      .setStyle(ButtonStyle.Secondary);
                    if (c.emoji) { try { b.setEmoji(c.emoji); } catch {} }
                    ar.addComponents(b);
                  }
                }
                if (ar.components.length) rows.push(ar);
              }
              await msg.edit({ embeds: [embed], components: rows }).catch(() => {});
              panelEdited = true;
            }
          }
        }
      } catch (e) { console.error('[application] re-render error:', e?.message); }

      const note = panelEdited ? '' : '\n⚠️ Applications panel has not been published yet (or its message is gone). Run `/panel send applications` to publish the updated buttons.';
      return interaction.editReply(`✅ **${typeId}** application is now **${closed ? 'CLOSED' : 'OPEN'}**.${note}`);
    }


// /create was a duplicate of /embed create — removed.

if (commandName === 'role') {
  const sub = interaction.options.getSubcommand();
  await interaction.deferReply({ flags: 64 });
  const targetUser = interaction.options.getUser('user', true);
  const member = interaction.options.getMember('user') || await interaction.guild.members.fetch(targetUser.id).catch(() => null);
  const role = interaction.options.getRole('role', true);
  if (!member) return interaction.editReply('❌ Member not found.');
  if (role.managed) return interaction.editReply('❌ That role is managed and cannot be changed.');
  if (interaction.guild.members.me.roles.highest.position <= role.position) return interaction.editReply('❌ My role must be above that role.');
  if (sub === 'grant') {
    const durationRaw = interaction.options.getString('duration');
    if (member.roles.cache.has(role.id)) return interaction.editReply(`${member} already has ${role}.`);
    await member.roles.add(role, `Granted by ${interaction.user.tag}`);
    let expiresAt = null;
    if (durationRaw) {
      const ms = parseDuration(durationRaw);
      if (!ms || ms < 60_000) return interaction.editReply('❌ Invalid duration. Use values like 2h, 3d, 1w.');
      expiresAt = Date.now() + ms;
      const existing = await store.getActiveTimedRole(interaction.guildId, member.id, role.id).catch(() => null);
      if (existing) await store.revokeTimedRole(interaction.guildId, member.id, role.id, interaction.user.id).catch(() => {});
      await store.addTimedRole({ guildId: interaction.guildId, userId: member.id, roleId: role.id, grantedBy: interaction.user.id, grantedAt: Date.now(), expiresAt, active: true }).catch(() => {});
    }
    await sendTicketQueueDm(member.id, buildTicketDmEmbed({ title: 'Role Granted', description: `You were given ${role}${expiresAt ? ` until <t:${Math.floor(expiresAt/1000)}:F>` : '.'}` }));
    return interaction.editReply(`✅ Granted ${role} to ${member}${expiresAt ? ` until <t:${Math.floor(expiresAt/1000)}:F>` : '.'}`);
  }
  if (sub === 'remove') {
    if (!member.roles.cache.has(role.id)) return interaction.editReply(`${member} does not have ${role}.`);
    await member.roles.remove(role, `Removed by ${interaction.user.tag}`);
    await store.revokeTimedRole(interaction.guildId, member.id, role.id, interaction.user.id).catch(() => {});
    await sendTicketQueueDm(member.id, buildTicketDmEmbed({ title: 'Role Removed', description: `Your ${role} role was removed in **${interaction.guild.name}**.` }));
    return interaction.editReply(`✅ Removed ${role} from ${member}.`);
  }
}

// /theme handler removed — was never registered as a slash command.


    // --- PRESTIGE COMMANDS ---
    // Moderation / utility
    if (commandName === 'lock') { await interaction.deferReply(); await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }); await interaction.editReply({ embeds: [new EmbedBuilder().setDescription('Channel locked.').setColor(0xFF0000)] }); }
    if (commandName === 'unlock') { await interaction.deferReply(); await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true }); await interaction.editReply({ embeds: [new EmbedBuilder().setDescription('Channel unlocked.').setColor(0x00FF00)] }); }
    if (commandName === 'say') { await interaction.deferReply({ flags: 64 }); await interaction.channel.send(options.getString('message')); await interaction.editReply('Sent.'); }
    if (commandName === 'purge') {
      // Simple bulk delete with an ephemeral embed confirmation
      await interaction.deferReply({ flags: 64 });
      const amount = Math.min(Math.max(options.getInteger('amount'), 1), 100);
      const deleted = await interaction.channel.bulkDelete(amount, true).catch(() => null);
      const count = deleted ? deleted.size : 0;
      const e = new EmbedBuilder()
        .setDescription(`Deleted **${count}** message(s).`)
        .setColor(0x2b2d31);
      await interaction.editReply({ embeds: [e] });
    }
  } catch (e) {
    // Never leave a command interaction stuck "thinking".
    try {
      if (interaction?.isChatInputCommand?.()) {
        const msg = '❌ Command failed. (Check bot logs for details.)';
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: msg }).catch(() => {});
        } else {
          await interaction.reply({ content: msg, flags: 64 }).catch(() => {});
        }
      }
    } catch {}
    if (e?.code !== 10062) console.error(e);
  }
});

function watchEmbed(w) {
  const isBuildPayment = !!(w.pendingBuildId || w.buildJobId || w.buildEditJobId);
  const fields = [
    { name: `${E_MEMBER} Customer Discord`, value: w.payer_discord_id ? `<@${w.payer_discord_id}>` : '—', inline: true },
    { name: `${E_SENDER} Customer IGN`, value: w.payer_ign ? `\`${w.payer_ign}\`` : '—', inline: true },
    { name: `${E_RECEIVER} Receiver IGN`, value: w.receiver_ign ? `\`${w.receiver_ign}\`` : '—', inline: true },
  ];
  if (!isBuildPayment && w.schematic) fields.push({ name: `${E_FARM} Build`, value: `**${w.schematic}**`, inline: true });
  fields.push(
    { name: `${E_PRICE} Price`, value: money(w.amount), inline: true },
    { name: `${E_STATUS} Status`, value: 'Watching', inline: true },
    { name: `${E_TIME} Expires`, value: tsR(w.expires_at), inline: false },
  );
  return new EmbedBuilder().setColor(0x5865f2).addFields(...fields).setFooter({ text: `Watch ID: ${w.id}` });
}

function watchProgressEmbed(w) {
  // No footer / last-check timestamp — just return the base embed updated live
  return watchEmbed(w);
}

function paidEmbed(w) {
  const isBuildPayment = !!(w.pendingBuildId || w.buildJobId || w.buildEditJobId);
  const fields = [
    { name: `${E_MEMBER} Customer Discord`, value: w.payer_discord_id ? `<@${w.payer_discord_id}>` : '—', inline: true },
    { name: `${E_SENDER} Customer IGN`, value: w.payer_ign ? `\`${w.payer_ign}\`` : '—', inline: true },
    { name: `${E_RECEIVER} Receiver IGN`, value: w.receiver_ign ? `\`${w.receiver_ign}\`` : '—', inline: true },
  ];
  if (!isBuildPayment && w.schematic) fields.push({ name: `${E_FARM} Build`, value: `**${w.schematic || 'N/A'}**`, inline: true });
  fields.push(
    { name: `${E_PRICE} Price`, value: money(w.amount), inline: true },
    { name: `${E_VERIFY} Verification`, value: 'Confirmed', inline: true },
    { name: `${E_TIME} Completed`, value: tsR(Date.now()), inline: false },
  );
  return new EmbedBuilder().setColor(0x57f287).addFields(...fields);
}

function paidEmbedTitle(w) {
  if (w.buildEditJobId) return 'Build Price Adjustment';
  if (w.pendingBuildId) return 'Build Payment';
  if (w.buildJobId) return 'Builder Payment';
  return 'Payment Logged';
}

function canceledEmbed(w) {
  const label = (w.pendingBuildId || w.buildJobId || w.buildEditJobId) ? 'build payment' : `payment for **${w.schematic}**`;
  return new EmbedBuilder().setColor(0x9b9b9b).setDescription(`Cancelled ${label}.`);
}
function failedEmbed(w, msg) { return new EmbedBuilder().setColor(0xed4245).setDescription(`Error: ${msg}`); }
function payBuilderRow(buildId) {
  return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`build_admin_pay:${buildId}`).setLabel('Pay Builder').setStyle(ButtonStyle.Success))];
}
async function restorePayBuilderButtonFromWatch(watch) {
  try {
    const buildId = watch?.buildJobId;
    if (!buildId) return;
    const job = await store.getBuildJob(buildId).catch(() => null);
    if (!job?.buildChannelId || !job?.buildMessageId) return;
    const buildCh = await client.channels.fetch(job.buildChannelId).catch(() => null);
    const buildMsg = buildCh ? await buildCh.messages.fetch(job.buildMessageId).catch(() => null) : null;
    if (!buildMsg) return;
    await buildMsg.edit({ embeds: [buildTrackingEmbed(job, 'AWAITING_PAYOUT')], components: payBuilderRow(buildId) }).catch(() => {});
  } catch {}
}
function cancelRow(watchId, enabled) { return enabled ? [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`paywatch_cancel:${watchId}`).setLabel('Cancel').setStyle(ButtonStyle.Danger))] : []; }
async function safeEditOriginal(watch, embeds, enableCancel) { try { if (!watch.message_id) return; const ch = await client.channels.fetch(watch.channel_id); const msg = await ch.messages.fetch(watch.message_id); await msg.edit({ content: '', embeds, components: cancelRow(watch.id, enableCancel) }); } catch {} }
async function endGiveawayLogic(g, channel, msg) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('disabled').setLabel('Ended').setStyle(ButtonStyle.Secondary).setDisabled(true).setEmoji('🎉')
  );
  let winnerText = 'No valid entries.';
  let winnerIds = [];
  if (g.entries.length > 0) {
    const unique = [...new Set(g.entries)];
    const shuffled = unique.sort(() => 0.5 - Math.random());
    winnerIds = shuffled.slice(0, g.winnersCount);
    winnerText = winnerIds.map(w => `<@${w}>`).join(', ');
  }
  const oldEmbed = msg.embeds[0];
  const newDesc = `Ended: ${tsR(Date.now())} (${ts(Date.now())})\nHosted by: <@${g.hostId}>\nEntries: **${g.entries.length}**\nWinners: ${winnerText}`;
  await msg.edit({ embeds: [new EmbedBuilder(oldEmbed.data).setColor(0x2F3136).setDescription(newDesc)], components: [row] });

  // Announce by replying to the original giveaway message
  try {
    // Delete any previous announcement message if tracked
    if (g.lastAnnounceMessageId) {
      const prev = await channel.messages.fetch(g.lastAnnounceMessageId).catch(() => null);
      if (prev) await prev.delete().catch(() => {});
    }
  } catch {}

  if (winnerIds.length > 0) {
    const announce = await msg.reply({ content: `🎉 Congratulations ${winnerText}, you won **${g.prize}**!` }).catch(() => null);
    if (announce) await store.updateGiveaway(g.messageId, { lastAnnounceMessageId: announce.id }).catch(() => {});
  } else {
    const announce = await msg.reply({ content: `Giveaway for **${g.prize}** ended with no entries.` }).catch(() => null);
    if (announce) await store.updateGiveaway(g.messageId, { lastAnnounceMessageId: announce.id }).catch(() => {});
  }
}
async function checkGiveaways() {
  try {
    const active = await store.getActiveGiveaways();
    const now = Date.now();
    for (const g of active) {
      let shouldEnd = false;
      if (g.endTime && now >= g.endTime) shouldEnd = true;
      if (g.entriesGoal && g.entries.length >= g.entriesGoal) shouldEnd = true;
      if (g.memberGoal) {
        try {
          const guild = await client.guilds.fetch(g.guildId);
          if (guild.memberCount >= g.memberGoal) shouldEnd = true;
        } catch {}
      }
      if (shouldEnd) {
        // Mark ended in store first to prevent double-ending
        await store.endGiveaway(g.messageId);
        try {
          const ch = await client.channels.fetch(g.channelId);
          const m = await ch.messages.fetch(g.messageId);
          await endGiveawayLogic(g, ch, m);
        } catch (e) {
          if (e?.code === 10008 || e?.code === 10003) {
            // Message/channel deleted — already ended in store, skip silently
          } else {
            console.error('[Giveaway] Auto-end error for', g.messageId, ':', e?.message || e);
          }
        }
      }
    }
  } catch (e) {
    console.error('[Giveaway] checkGiveaways error:', e?.message || e);
  }
}
if (!global.__paywatchRetryState) global.__paywatchRetryState = new Map();

async function pollOnce(watchId) { 
  const retryState = global.__paywatchRetryState;
  const w = await store.getWatch(watchId); 
  if (!w || w.status !== 'WATCHING') { retryState.delete(watchId); return stopPaywatchPolling(watchId); }
  if (Date.now() > w.expires_at) {
    const expired = await store.updateWatch(watchId, { status: 'EXPIRED' });
    await safeEditOriginal(expired, [failedEmbed(expired, '⏳ Expired')], false);
    try {
      if (expired?.message_id) {
        const chx = await client.channels.fetch(expired.channel_id).catch(() => null);
        const mx = chx ? await chx.messages.fetch(expired.message_id).catch(() => null) : null;
        if (mx) await mx.edit({ embeds: [failedEmbed(expired, '⏳ Expired')], components: [] }).catch(() => {});
      }
    } catch {}
    await restorePayBuilderButtonFromWatch(expired).catch(() => {});
    retryState.delete(watchId);
    stopPaywatchPolling(watchId);
    return;
  }
  try {
    const payerBal = await getUserBalance({ baseUrl: DONUTSMP_BASE_URL, pathTemplate: DONUTSMP_STATS_PATH, apiKey: DONUTSMP_API_KEY, user: w.payer_ign, balancePath: DONUTSMP_BALANCE_PATH });
    const recvBal = await getUserBalance({ baseUrl: DONUTSMP_BASE_URL, pathTemplate: DONUTSMP_STATS_PATH, apiKey: DONUTSMP_API_KEY, user: w.receiver_ign, balancePath: DONUTSMP_BALANCE_PATH });
    retryState.delete(watchId);
    const updated = await store.updateWatch(watchId, { payer_end_balance: payerBal, receiver_end_balance: recvBal, last_check_at: Date.now() });
    const payerDrop = updated.payer_start_balance - updated.payer_end_balance;
    const recvGain = updated.receiver_end_balance - updated.receiver_start_balance;

    const lastEdit = updated.last_message_edit_at || 0;
    if (Date.now() - lastEdit > 15000) {
      await store.updateWatch(watchId, { last_message_edit_at: Date.now() }).catch(() => {});
      await safeEditOriginal(updated, [watchProgressEmbed(updated)], true);
    }

    if (payerDrop >= updated.amount && recvGain >= updated.amount) {
      await handleWatchPaid(watchId);
    }
  } catch (e) {
    const code = e?.code || e?.status || e?.cause?.code || null;
    const msg = String(e?.message || e || 'unknown error');
    const prev = retryState.get(watchId) || { count: 0 };
    const next = { count: prev.count + 1, lastError: msg, lastAt: Date.now(), code };
    retryState.set(watchId, next);
    const transient = msg.includes('fetch failed') || msg.includes('API error 524') || msg.includes('Connect Timeout') || code === 'UND_ERR_CONNECT_TIMEOUT' || code === 524;
    if (!transient) {
      console.error(`[Paywatch Poll] ${watchId} attempt ${next.count} failed:`, msg);
    }
    if (!transient && next.count >= 3) {
      await store.updateWatch(watchId, { last_check_at: Date.now() }).catch(() => {});
    }
  }
}

// Extracted: run the full "payment confirmed" flow for a given watchId
// Called by both pollOnce and /pay force-complete
async function handleWatchPaid(watchId) {
      const paid = await store.updateWatch(watchId, { status: 'PAID' }); 
      await store.addPayment({ watch_id: paid.id, guild_id: paid.guild_id, channel_id: paid.channel_id, payer_discord_id: paid.payer_discord_id, payer_ign: paid.payer_ign, receiver_ign: paid.receiver_ign, amount: paid.amount, schematic: paid.schematic, note: paid.note, paid_at: Date.now() }); 
      await safeEditOriginal(paid, [paidEmbed(paid)], false); 
      try { if (paid.message_id) { const ch0 = await client.channels.fetch(paid.channel_id).catch(() => null); const m0 = ch0 ? await ch0.messages.fetch(paid.message_id).catch(() => null) : null; if (m0) await m0.edit({ embeds: [paidEmbed(paid)], components: [] }).catch(() => {}); } } catch {}
      const logCh = await client.channels.fetch(PAYMENT_LOG_CHANNEL_ID).catch(() => null); 
      if (logCh) await logCh.send({ embeds: [paidEmbed(paid).setTitle(paidEmbedTitle(paid))] }); 
      
      // ── If this watch is a PRE-BUILD customer payment, activate the build ──────
      if (paid.pendingBuildId) {
        try {
          const job = await store.getBuildJob(paid.pendingBuildId).catch(() => null);
          if (job && job.status === 'WAITING_PAYMENT') {
            const activatedAt = Date.now();
            const buildCh = await client.channels.fetch(C.CHANNEL_BUILD_TRACKING).catch(() => null);
            if (buildCh) {
              const doneBtn    = new ButtonBuilder().setCustomId(`build_done:${job.id}`).setLabel('Mark Done').setStyle(ButtonStyle.Success);
              const cancelBtn  = new ButtonBuilder().setCustomId(`build_cancel:${job.id}`).setLabel('Cancel Build').setStyle(ButtonStyle.Danger);
              const trackRow   = new ActionRowBuilder().addComponents(doneBtn, cancelBtn);
              const trackEmbed = buildTrackingEmbed(job, 'PENDING', { customerPaidAt: activatedAt, timestamp: activatedAt });
              const msg = await buildCh.send({ embeds: [trackEmbed], components: [trackRow] }).catch(() => null);
              if (msg) {
                await store.updateBuildJob(job.id, { status: 'PENDING', activatedAt, channelId: msg.channelId, messageId: msg.id, buildChannelId: msg.channelId, buildMessageId: msg.id });
              }
            }
            if (job.ticketChannelId) {
              await store.updateTicketRecord(job.ticketChannelId, {
                ticketType: 'building',
                buildFarmName: job.buildType,
                buildAmount: job.price,
                claimerUsername: job.builderIgn || job.claimerUsername,
                claimedById: job.builderDiscordId || job.claimedById || null,
                manualRename: false,
              }).catch(() => {});
              const ticketCh2 = await client.channels.fetch(job.ticketChannelId).catch(() => null);
              const rec2 = ticketCh2 ? await store.getTicketRecord(job.ticketChannelId).catch(() => null) : null;
              if (ticketCh2 && rec2) await syncTicketChannelName(ticketCh2, rec2, { notifyChannel: ticketCh2, commandLabel: 'payment confirmed' }).catch(() => {});
            }
            // Delete the paywatch message in the ticket channel
            if (paid.message_id) {
              const pwCh = await client.channels.fetch(paid.channel_id).catch(() => null);
              if (pwCh) pwCh.messages.fetch(paid.message_id).then(m => m.delete()).catch(() => {});
            }
            // Announce in the ticket channel that payment is confirmed
            if (job.ticketChannelId) {
              const ticketCh = await client.channels.fetch(job.ticketChannelId).catch(() => null);
              if (ticketCh) {
                await ticketCh.send({
                  embeds: [new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setTitle('Payment Confirmed — Build Started!')
                    .setDescription(`**${job.customerIgn}** has paid **${money(job.price)}**. The build is now in progress.\n\nTracking in <#1483225253089120458>.`)]
                }).catch(() => {});
              }
            }
          }
        } catch {}
      }

      // ── If this watch is a BUILD PRICE ADJUSTMENT, delete watch msg and update embed ──
      if (paid.buildEditJobId) {
        try {
          const job = await store.getBuildJob(paid.buildEditJobId).catch(() => null);
          if (job) {
            // Price was already updated at command time; just refresh the tracking embed
            if (job.buildMessageId && job.buildChannelId) {
              const buildCh = await client.channels.fetch(job.buildChannelId).catch(() => null);
              if (buildCh) {
                const buildMsg = await buildCh.messages.fetch(job.buildMessageId).catch(() => null);
                if (buildMsg) {
                  let comps = buildMsg.components;
                  if (job.status === 'AWAITING_PAYOUT') {
                    const payBtn = new ButtonBuilder().setCustomId(`build_admin_pay:${job.id}`).setLabel('Pay Builder').setStyle(ButtonStyle.Success);
                    comps = [new ActionRowBuilder().addComponents(payBtn)];
                  }
                  await buildMsg.edit({ embeds: [buildTrackingEmbed(job, job.status)], components: comps }).catch(() => {});
                }
              }
            }
          }
          // Delete the price-adjustment paywatch message
          if (paid.message_id) {
            const pwCh = await client.channels.fetch(paid.channel_id).catch(() => null);
            if (pwCh) await pwCh.messages.fetch(paid.message_id).then(m => m.delete()).catch(() => {});
          }
        } catch {}
      }

      // ── If this watch is the BUILDER PAYOUT, finalize the build record ──────────
      if (paid.buildJobId) {
        try {
          const job = await store.getBuildJob(paid.buildJobId).catch(() => null);
          if (job) {
            const finalAt = Date.now();
            const buildCh = await client.channels.fetch(paid.buildChannelId || C.CHANNEL_BUILD_TRACKING).catch(() => null);
            if (buildCh && paid.buildMessageId) {
              const buildMsg = await buildCh.messages.fetch(paid.buildMessageId).catch(() => null);
              if (buildMsg) {
                const doneEmbed = buildTrackingEmbed(job, 'COMPLETE', { finalizedAt: finalAt, timestamp: finalAt });
                await buildMsg.edit({ embeds: [doneEmbed], components: [] }).catch(() => {});
              }
            }
            await store.updateBuildJob(paid.buildJobId, { status: 'COMPLETE', finalizedAt: finalAt }).catch(() => {});
            // Log to persistent build history
            await store.addBuildRecord(paid.guild_id, {
              status: 'FINISHED',
              amount: job.price,
              price: job.price,
              builderIgn: job.builderIgn,
              customerIgn: job.customerIgn,
              receiverIgn: job.receiverIgn,
              builderDiscordId: job.builderDiscordId || job.completedBy || null,
              customerDiscordId: job.customerDiscordId || null,
              at: finalAt,
            }).catch(() => {});
          }
          // Delete the paywatch message now that it's no longer needed
          if (paid.message_id) {
            const pwCh = await client.channels.fetch(paid.channel_id).catch(() => null);
            if (pwCh) await pwCh.messages.fetch(paid.message_id).then(m => m.delete()).catch(() => {});
          }
        } catch {}
      }
      
      // Auto-fulfillment: deliver schematic file privately via DM
      try {
        if (paid.file_path) {
          const candidates = [
            paid.file_path,
            path.isAbsolute(paid.file_path) ? null : path.join(process.cwd(), paid.file_path),
            path.isAbsolute(paid.file_path) ? null : path.join(__dirname, paid.file_path)
          ].filter(Boolean);
          const found = candidates.find(p => fs.existsSync(p));
          if (!found) {
            const ch2 = await client.channels.fetch(paid.channel_id).catch(() => null);
            if (ch2) await ch2.send({ content: `⚠️ Payment confirmed but I couldn't find the schematic file for **${paid.schematic}**. Staff: please check the file path.` }).catch(() => {});
          } else {
            const att = new AttachmentBuilder(found);
          const deliveryEmbed = new EmbedBuilder()
            .setDescription(`Here is your purchase: **${paid.schematic}**`)
            .setColor(0x57f287)
            .setFooter({ text: 'Thank you for your purchase!' });
          
          const buyer = await client.users.fetch(paid.payer_discord_id).catch(() => null);
          if (buyer) {
            await buyer.send({ embeds: [deliveryEmbed], files: [att] });
            // Public confirmation in channel without file
            const ch2 = await client.channels.fetch(paid.channel_id).catch(() => null);
            if (ch2) await ch2.send({ content: `✅ Schematic **${paid.schematic}** has been sent to <@${paid.payer_discord_id}>'s DMs.` });
          } else {
             // Fallback if user not found/DMs closed: send in channel with ping
             const ch2 = await client.channels.fetch(paid.channel_id).catch(() => null);
             if (ch2) await ch2.send({ content: `<@${paid.payer_discord_id}> I couldn't DM you! Here is your file:`, files: [att] });
          }
          }
          await store.updateWatch(paid.id, { status: 'DELIVERED', delivered_at: Date.now() });
        }
      } catch (e) {
        console.error('Fulfillment error:', e.message);
      }

      stopPaywatchPolling(paid.id); 
      

}

async function startPaywatchPolling(watchId) {
  if (paywatchTimers.has(watchId)) return;
  const tick = async () => {
    if (!paywatchTimers.has(watchId)) return;
    await pollOnce(watchId);
    if (!paywatchTimers.has(watchId)) return;
    const rs = (global.__paywatchRetryState && global.__paywatchRetryState.get(watchId)) || { count: 0 };
    const delay = rs.count > 0 ? Math.min(60000, 5000 * (2 ** Math.min(rs.count - 1, 3))) : PAYWATCH_POLL_MS;
    const timeout = setTimeout(tick, delay);
    paywatchTimers.set(watchId, timeout);
  };
  paywatchTimers.set(watchId, setTimeout(tick, 0));
}
function stopPaywatchPolling(watchId) { const t = paywatchTimers.get(watchId); if (t) clearTimeout(t); paywatchTimers.delete(watchId); if (global.__paywatchRetryState) global.__paywatchRetryState.delete(watchId); }

// runPrestigeUpgrades removed

// Sponsorship / staff pay board removed

// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════

async function ensureLoaReactionPanel() {
  try {
    const guild = client.guilds.cache.get('1483225250698105063');
    if (!guild) return;

    const cfg = await store.getLoaConfig().catch(() => ({ channelId: '', messageId: '', roleId: '' }));
    const roleId = String(cfg?.roleId || LOA_ROLE_ID || '');
    let channelId = String(cfg?.channelId || '');
    let messageId = String(cfg?.messageId || '');

    if (!messageId) {
      const storedId = await store.getConfigValue(guild.id, 'LOA_PANEL_MESSAGE_ID').catch(() => null);
      if (storedId) messageId = String(storedId);
    }
    if (!channelId) channelId = String(C.CHANNEL_WELCOME || '');
    if (!roleId || !channelId) return;

    const ch = await guild.channels.fetch(channelId).catch(() => null);
    if (!ch?.isTextBased?.()) return;

    let msg = messageId ? await ch.messages.fetch(messageId).catch(() => null) : null;
    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle('LOA Role')
      .setDescription(`React with 📵 to toggle the **LOA** role.\n\nRemove your reaction to remove the role. This embed is safe to edit later.`)
      .setTimestamp();

    if (!msg) {
      msg = await ch.send({ embeds: [embed] }).catch(() => null);
      if (!msg) return;
    } else {
      await msg.edit({ embeds: [embed] }).catch(() => {});
    }

    await store.setLoaConfig({ channelId: ch.id, messageId: msg.id, roleId }).catch(() => {});
    await store.setConfigValue(guild.id, 'LOA_PANEL_MESSAGE_ID', msg.id).catch(() => {});

    const has = msg.reactions?.cache?.find?.(r => r.emoji?.name === '📵');
    if (!has) await msg.react('📵').catch(() => {});
  } catch (e) { console.error('LOA panel error:', e?.message || e); }
}

async function handleLoaReaction(reaction, user, shouldHaveRole) {
  try {
    if (!user || user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => null);
    const message = reaction.message;
    if (!message?.guildId || reaction.emoji?.name !== '📵') return;

    const cfg = await store.getLoaConfig().catch(() => ({ channelId: '', messageId: '', roleId: '' }));
    const roleId = String(cfg?.roleId || LOA_ROLE_ID || '');
    const panelId = String(cfg?.messageId || (await store.getConfigValue(message.guildId, 'LOA_PANEL_MESSAGE_ID').catch(() => null)) || '');
    if (!panelId || String(message.id) !== panelId || !roleId) return;

    const guild = message.guild || await client.guilds.fetch(message.guildId).catch(() => null);
    const member = guild ? await guild.members.fetch(user.id).catch(() => null) : null;
    if (!member) return;
    if (shouldHaveRole) {
      if (!member.roles.cache.has(roleId)) await member.roles.add(roleId, 'LOA reaction role').catch(() => {});
    } else {
      if (member.roles.cache.has(roleId)) await member.roles.remove(roleId, 'LOA reaction role').catch(() => {});
    }
  } catch (e) { console.error('LOA reaction error:', e?.message || e); }
}

client.on(Events.MessageReactionAdd, (reaction, user) => { handleLoaReaction(reaction, user, true); });
client.on(Events.MessageReactionRemove, (reaction, user) => { handleLoaReaction(reaction, user, false); });

// Use the explicit ClientReady event (discord.js v14+).
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Register automod / anti-raid listeners
  automod.register(client, store);
  antiraid.register(client, store);
  await ensureLoaReactionPanel().catch(() => {});

  cleanupTranscriptsOnBoot().catch(() => {});

  // Builder board auto-updates
  const tick = async () => {
    try {
      const boards = await store.listBuilderBoards().catch(() => ({}));
      for (const gid of Object.keys(boards || {})) {
        const g = client.guilds.cache.get(gid);
        if (!g) continue;
        await refreshBuildersBoard(g).catch(() => {});
      }
    } catch {}
  };
  tick().catch(() => {});
  setInterval(() => tick().catch(() => {}), 60 * 1000);
});

client.login(cfg.token);
