const path = require('node:path');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const { getLevelFromXp } = require('./utils');

// NOTE:
// lowdb's default writer (steno) uses a fixed temp filename (".data.json.tmp").
// On Windows, concurrent writes (or AV/file watchers) can cause ENOENT during rename.
// We avoid that class of failure by using a per-process write queue + unique temp filenames.

const file = path.join(process.cwd(), 'data.json');
const bakFile = path.join(process.cwd(), 'data.json.bak');

const DEFAULT_DATA = {
  warnings: [],
  strikes: [],
  vouches: [],
  giveaways: [],
  watches: [],
  payments: [],
  infractions: [],
  vouchboard: {},
  stickies: [],
  xp: [],
  schematics: [],
  schematicPanels: {},
  dropdownPanels: {},
  settings: { receiverIgn: 'iEtZ', xpMultiplier: 1 },
  channelReceivers: {},
  channelXpMultipliers: {},
  // AFK state: { [guildId]: { [userId]: { reason: string, since: number } } }
  afk: {},
  // Nickname overrides: { [guildId]: { [userId]: string } }
  nickOverrides: {},
  // Prestige tracking: { [guildId]: { [userId]: { since:number } } }
  prestige: {},
  guildThemes: {},
  builderWork: {},
  builderBoard: {},
  // staff ticket stats
  ticketStats: {},
  // build completion logs
  buildHistory: {},
  builderFinishedCounts: {},
  builderFinishedCountsById: {},
  // /build start jobs
  buildJobs: {},
  // Weekly staff pay tracking: { weekStart: number, boardMessageId: string|null, members: { [userId]: { paid: bool, streak: number } } }
  staffPay: { weekStart: 0, boardMessageId: null, members: {} },
  staffList: { support: {}, builders: {}, supportMessageId: null, buildersMessageId: null },
  serverConfig: {},
  automodConfig: {},
  buildRequests: {},
  loa: { channelId: '', messageId: '', roleId: '' },
};

let isReady = false;
let data = null;

// When disk is full we should stop trying to persist until there's space again.
let persistenceDisabledUntil = 0;
let lastDiskErrorLoggedAt = 0;

function dataStore() {
  if (!data) data = normalizeData(null);
  return data;
}

// Simple async mutex/queue to serialize writes
let writeQueue = Promise.resolve();

async function safeReadJson(p) {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e && e.code === 'ENOENT') return null;
    // If JSON parse fails, fall back to defaults rather than crashing the bot
    return null;
  }
}

async function safeReadJsonWithBackup(primary, backup) {
  const a = await safeReadJson(primary);
  if (a) return a;
  const b = await safeReadJson(backup);
  return b;
}

function clampArray(arr, max) {
  if (!Array.isArray(arr)) return [];
  if (!Number.isFinite(max) || max <= 0) return [];
  if (arr.length <= max) return arr;
  return arr.slice(arr.length - max);
}

function pruneTicketRecords(ts) {
  if (!ts || !ts.tickets) return;
  const now = Date.now();
  const KEEP_CLOSED_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (was 30)
  const MAX_CLOSED = 30; // hard cap on closed tickets stored

  // First, remove any closed tickets older than 7 days
  for (const [channelId, rec] of Object.entries(ts.tickets)) {
    if (!rec || typeof rec !== 'object') { delete ts.tickets[channelId]; continue; }
    if (rec.status === 'OPEN') continue;
    const closedAt = Number(rec.closedAt || 0);
    if (closedAt && now - closedAt > KEEP_CLOSED_MS) {
      delete ts.tickets[channelId];
    }
  }

  // Then enforce the hard cap: if still more than MAX_CLOSED closed tickets, drop oldest
  const closedEntries = Object.entries(ts.tickets)
    .filter(([, r]) => r && r.status !== 'OPEN')
    .sort((a, b) => (a[1].closedAt || 0) - (b[1].closedAt || 0));
  const toDelete = closedEntries.slice(0, Math.max(0, closedEntries.length - MAX_CLOSED));
  for (const [channelId] of toDelete) delete ts.tickets[channelId];
}

function pruneData(d) {
  // Keep data.json small on free hosting.
  d.warnings = clampArray(d.warnings, 500);
  d.strikes = clampArray(d.strikes, 200);
  d.infractions = clampArray(d.infractions, 500);
  d.payments = clampArray(d.payments, 100);     // posted to Discord, safe to trim
  d.watches = clampArray(d.watches, 50);         // completed watches accumulate fast
  d.giveaways = clampArray(d.giveaways, 50);
  d.schematics = clampArray(d.schematics, 200);
  d.xp = clampArray(d.xp, 2000);                // XP is the biggest array
  if (d.ticketSystem) pruneTicketRecords(d.ticketSystem);
  // Prune finished/cancelled build jobs older than 7 days
  if (d.buildJobs && typeof d.buildJobs === 'object') {
    const now = Date.now();
    for (const [id, job] of Object.entries(d.buildJobs)) {
      if (!job || typeof job !== 'object') { delete d.buildJobs[id]; continue; }
      if (job.status === 'PENDING' || job.status === 'WAITING_PAYMENT' || job.status === 'AWAITING_CONFIRM' || job.status === 'AWAITING_PAYOUT') continue;
      if (now - (job.completedAt || job.createdAt || 0) > 3 * 24 * 60 * 60 * 1000) {
        delete d.buildJobs[id];
      }
    }
  }
  // Prune very old completed watches
  if (Array.isArray(d.watches)) {
    const now = Date.now();
    d.watches = d.watches.filter(w => {
      if (w.status === 'WATCHING') return true;
      return now - (w.created_at || 0) < 2 * 24 * 60 * 60 * 1000;
    });
  }
  // Prune ended giveaways older than 3 days
  if (Array.isArray(d.giveaways)) {
    const now = Date.now();
    d.giveaways = d.giveaways.filter(g => {
      if (!g.ended) return true;
      return now - (g.createdAt || 0) < 3 * 24 * 60 * 60 * 1000;
    });
  }
}

function normalizeData(d) {
  const out = { ...DEFAULT_DATA, ...(d || {}) };
  out.warnings ||= [];
  out.strikes ||= [];
  out.vouches ||= [];
  out.giveaways ||= [];
  out.watches ||= [];
  out.payments ||= [];
  out.infractions ||= [];
  out.vouchboard ||= {};
  out.stickies ||= [];
  out.xp ||= [];
  out.schematics ||= [];
  out.schematicPanels ||= {};
  out.dropdownPanels ||= {};
  out.settings ||= { receiverIgn: 'iEtZ', xpMultiplier: 1 };
  out.channelReceivers ||= {};
  out.channelXpMultipliers ||= {};
  out.afk ||= {};
  out.prestige ||= {};
  out.guildThemes ||= {};
  out.builderWork ||= {};
  out.builderBoard ||= {};
  out.buildJobs ||= {};
  out.builderFinishedCountsById ||= {};
  out.autonick ||= {};
  out.loas ||= [];
  out.timedRoles ||= [];
  out.catalogFarms ||= [];
  out.catalogPanels ||= {};
  out.catalogPrices ||= {};
  out.staffPay ||= { weekStart: 0, boardMessageId: null, members: {} };
  out.staffPay.members ||= {};
  out.staffPay.boardMessageId ??= null;
  out.staffList ||= { support: {}, builders: {}, supportMessageId: null, buildersMessageId: null };
  out.staffList.support ||= {};
  out.staffList.builders ||= {};
  out.staffList.supportMessageId ??= null;
  out.staffList.buildersMessageId ??= null;
  out.serverConfig ||= {};
  out.automodConfig ||= {};
  out.buildRequests ||= {};
  out.loa ||= { channelId: '', messageId: '', roleId: '' };
  out.loa.channelId ||= '';
  out.loa.messageId ||= '';
  out.loa.roleId ||= '';
  // ticketSystem is optional; ensureTicketSystemDefaults will fill it lazily
  try { pruneData(out); } catch {}
  return out;
}

// --- PRESTIGE ---
async function setPrestigeSince(guildId, userId, since) {
  await ensureDb();
  dataStore().prestige ||= {};
  dataStore().prestige[guildId] ||= {};
  dataStore().prestige[guildId][userId] = { since: Number(since) || Date.now() };
  scheduleDbWrite();
  return dataStore().prestige[guildId][userId];
}

async function getPrestigeSince(guildId, userId) {
  await ensureDb();
  return dataStore().prestige?.[guildId]?.[userId]?.since || null;
}

async function clearPrestige(guildId, userId) {
  await ensureDb();
  if (!dataStore().prestige?.[guildId]?.[userId]) return false;
  delete dataStore().prestige[guildId][userId];
  scheduleDbWrite();
  return true;
}

// --- AFK ---
async function setAfk(guildId, userId, reason) {
  await ensureDb();
  dataStore().afk ||= {};
  dataStore().afk[guildId] ||= {};
  dataStore().afk[guildId][userId] = { reason: reason || '', since: Date.now() };
  scheduleDbWrite();
  return dataStore().afk[guildId][userId];
}

async function clearAfk(guildId, userId) {
  await ensureDb();
  if (!dataStore().afk || !dataStore().afk[guildId] || !dataStore().afk[guildId][userId]) return false;
  delete dataStore().afk[guildId][userId];
  scheduleDbWrite();
  return true;
}

async function getAfk(guildId, userId) {
  await ensureDb();
  return (dataStore().afk && dataStore().afk[guildId] && dataStore().afk[guildId][userId]) ? dataStore().afk[guildId][userId] : null;
}

async function writeDb() {
  // Serialize writes to avoid overlapping writes.
  writeQueue = writeQueue.then(async () => {
    const now = Date.now();
    if (now < persistenceDisabledUntil) return;

    const dir = path.dirname(file);
    await fs.mkdir(dir, { recursive: true });

    // Prune before persisting to keep disk usage under control.
    try { pruneData(data); } catch {}

    const json = JSON.stringify(data, null, 2);

    // Atomic write: write to unique tmp then rename over the real file.
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    try {
      await fs.writeFile(tmp, json, 'utf8');
      // Best-effort backup of last-known-good
      await fs.copyFile(file, bakFile).catch(() => {});
      await fs.rename(tmp, file);
      return;
    } catch (e) {
      // Clean up tmp if present
      await fs.unlink(tmp).catch(() => {});

      // If disk is full, do NOT risk truncating/corrupting data.json. Pause persistence.
      if (e && (e.code === 'ENOSPC' || e.code === 'EDQUOT')) {
        persistenceDisabledUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
        if (Date.now() - lastDiskErrorLoggedAt > 60_000) {
          lastDiskErrorLoggedAt = Date.now();
          console.error('[DB] Disk full (ENOSPC/EDQUOT). Pausing persistence for 5 minutes.');
        }
        return;
      }

      // If rename fails due to locks, fall back to direct write with retries.
      if (e && (e.code === 'EPERM' || e.code === 'EBUSY' || e.code === 'EACCES')) {
        const delays = [0, 50, 100, 200, 400, 800];
        let lastErr = e;
        for (let i = 0; i < delays.length; i++) {
          if (delays[i]) await new Promise(r => setTimeout(r, delays[i]));
          try {
            await fs.writeFile(file, json, 'utf8');
            return;
          } catch (ee) {
            lastErr = ee;
            if (!ee || (ee.code !== 'EPERM' && ee.code !== 'EBUSY' && ee.code !== 'EACCES')) break;
          }
        }
        throw lastErr;
      }

      throw e;
    }
  });
  return writeQueue;
}

let scheduledFlush = null;
function scheduleDbWrite() {
  if (scheduledFlush) return;
  scheduledFlush = setTimeout(() => {
    scheduledFlush = null;
    // fire-and-forget; writeQueue will serialize it
    writeDb().catch(console.error);
  }, 15000);
}

// Force an immediate flush (used for important events like level-ups)
async function flushNow() {
  if (scheduledFlush) {
    clearTimeout(scheduledFlush);
    scheduledFlush = null;
  }
  await writeDb();
}

// Flush pending scheduled write on shutdown
process.once('SIGINT', async () => {
  try {
    if (scheduledFlush) { clearTimeout(scheduledFlush); scheduledFlush = null; }
    await writeDb();
  } finally {
    process.exit(0);
  }
});
process.once('SIGTERM', async () => {
  try {
    if (scheduledFlush) { clearTimeout(scheduledFlush); scheduledFlush = null; }
    await writeDb();
  } finally {
    process.exit(0);
  }
});

async function init() {
  if (isReady) return;
  const existing = await safeReadJsonWithBackup(file, bakFile);
  data = normalizeData(existing);
  await writeDb();
  isReady = true;
}

async function ensureDb() {
  if (!isReady) await init();
}


// --- TIMED ROLES ---
async function addTimedRole(entry) {
  await ensureDb();
  dataStore().timedRoles ||= [];
  const guildId = String(entry.guildId);
  const userId = String(entry.userId);
  const roleId = String(entry.roleId);
  const existing = dataStore().timedRoles.find(r => r && r.active !== false && String(r.guildId) === guildId && String(r.userId) === userId && String(r.roleId) === roleId);
  const now = Date.now();
  if (existing) {
    existing.expiresAt = Number(entry.expiresAt) || 0;
    existing.grantedBy = entry.grantedBy ? String(entry.grantedBy) : existing.grantedBy || null;
    existing.grantedAt = Number(entry.grantedAt) || existing.grantedAt || now;
    existing.revokedAt = null;
    existing.revokedBy = null;
    existing.active = true;
    scheduleDbWrite();
    return existing;
  }
  const rec = {
    id: randomUUID(),
    guildId,
    userId,
    roleId,
    grantedBy: entry.grantedBy ? String(entry.grantedBy) : null,
    grantedAt: Number(entry.grantedAt) || now,
    expiresAt: Number(entry.expiresAt) || 0,
    active: entry.active !== false,
    revokedAt: null,
    revokedBy: null,
  };
  dataStore().timedRoles.push(rec);
  scheduleDbWrite();
  return rec;
}

async function getActiveTimedRole(guildId, userId, roleId) {
  await ensureDb();
  dataStore().timedRoles ||= [];
  return dataStore().timedRoles.find(r => r && r.active !== false && String(r.guildId) === String(guildId) && String(r.userId) === String(userId) && String(r.roleId) === String(roleId)) || null;
}

async function listTimedRoles(guildId = null) {
  await ensureDb();
  dataStore().timedRoles ||= [];
  const rows = dataStore().timedRoles.filter(Boolean);
  return guildId == null ? rows : rows.filter(r => String(r.guildId) === String(guildId));
}

async function listExpiredTimedRoles(now = Date.now()) {
  await ensureDb();
  dataStore().timedRoles ||= [];
  return dataStore().timedRoles.filter(r => r && r.active !== false && Number(r.expiresAt) > 0 && Number(r.expiresAt) <= Number(now));
}

async function revokeTimedRole(guildId, userId, roleId, revokedBy = null) {
  await ensureDb();
  dataStore().timedRoles ||= [];
  const rec = dataStore().timedRoles.find(r => r && r.active !== false && String(r.guildId) === String(guildId) && String(r.userId) === String(userId) && String(r.roleId) === String(roleId));
  if (!rec) return false;
  rec.active = false;
  rec.revokedAt = Date.now();
  rec.revokedBy = revokedBy ? String(revokedBy) : null;
  scheduleDbWrite();
  return true;
}
// --- STICKY MESSAGES (Updated for Multiple) ---
async function addSticky(channelId, stickyData) {
  await ensureDb();
  // Generate a random ID for the sticky to track it individually
  const stickyId = Math.random().toString(36).substring(2, 9);
  dataStore().stickies.push({ 
    id: stickyId,
    channelId, 
    content: stickyData.content, 
    embed: stickyData.embed, 
    lastMessageId: null 
  });
  scheduleDbWrite();
  return stickyId;
}

async function getStickies(channelId) {
  await ensureDb();
  return dataStore().stickies.filter(s => s.channelId === channelId);
}

// Removes ALL stickies for a channel (simplest for command handling)
async function clearStickies(channelId) {
  await ensureDb();
  dataStore().stickies = dataStore().stickies.filter(s => s.channelId !== channelId);
  scheduleDbWrite();
}

async function updateStickyMessageId(stickyId, messageId) {
  await ensureDb();
  const sticky = dataStore().stickies.find(s => s.id === stickyId);
  if (sticky) {
    sticky.lastMessageId = messageId;
    scheduleDbWrite();
  }
}

async function getStickyById(stickyId) {
  await ensureDb();
  return dataStore().stickies.find(s => s.id === stickyId) || null;
}

async function updateSticky(stickyId, stickyData) {
  await ensureDb();
  const sticky = dataStore().stickies.find(s => s.id === stickyId);
  if (!sticky) return false;
  sticky.content = stickyData.content;
  sticky.embed = stickyData.embed;
  scheduleDbWrite();
  return true;
}

// --- XP SYSTEM ---
async function getUserXp(userId, guildId) {
  await ensureDb();
  let user = dataStore().xp.find(x => x.userId === userId && x.guildId === guildId);
  if (!user) {
    user = { userId, guildId, xp: 0, level: 0, lastXpTime: 0 };
    dataStore().xp.push(user);
    scheduleDbWrite();
  }
  if (typeof user.level !== 'number' || user.level < 0) {
    user.level = getLevelFromXp(user.xp || 0);
    scheduleDbWrite();
  }
  return user;
}

async function addXp(userId, guildId, amount) {
  await ensureDb();
  let user = dataStore().xp.find(x => x.userId === userId && x.guildId === guildId);
  if (!user) {
    user = { userId, guildId, xp: 0, level: 0, lastXpTime: 0 };
    dataStore().xp.push(user);
  }
  user.xp += amount;
  user.level = getLevelFromXp(user.xp);
  user.lastXpTime = Date.now();
  scheduleDbWrite();
  return user.xp;
}

async function setXp(userId, guildId, amount) {
  await ensureDb();
  let user = dataStore().xp.find(x => x.userId === userId && x.guildId === guildId);
  if (!user) {
    user = { userId, guildId, xp: 0, level: 0, lastXpTime: 0 };
    dataStore().xp.push(user);
  }
  user.xp = amount;
  user.level = getLevelFromXp(user.xp);
  scheduleDbWrite();
  return user.xp;
}

async function getRank(userId, guildId) {
  await ensureDb();
  const sorted = dataStore().xp.filter(x => x.guildId === guildId).sort((a, b) => b.xp - a.xp);
  return sorted.findIndex(x => x.userId === userId) + 1;
}

// --- SETTINGS & HELPERS ---
async function getReceiverIgnGlobal() { await ensureDb(); return (dataStore().settings && dataStore().settings.receiverIgn) ? dataStore().settings.receiverIgn : 'iEtZ'; }
async function setReceiverIgnGlobal(ign) { await ensureDb(); dataStore().settings ||= {}; dataStore().settings.receiverIgn = ign; scheduleDbWrite(); return ign; }
async function getReceiverIgn(channelId) { await ensureDb(); if (channelId && dataStore().channelReceivers && dataStore().channelReceivers[channelId]) return dataStore().channelReceivers[channelId]; return getReceiverIgnGlobal(); }
async function setChannelReceiverIgn(channelId, ign) { await ensureDb(); dataStore().channelReceivers ||= {}; dataStore().channelReceivers[channelId] = ign; scheduleDbWrite(); return ign; }
async function clearChannelReceiverIgn(channelId) { await ensureDb(); dataStore().channelReceivers ||= {}; delete dataStore().channelReceivers[channelId]; scheduleDbWrite(); }
async function getXpMultiplierGlobal() { await ensureDb(); const v = dataStore().settings && typeof dataStore().settings.xpMultiplier === 'number' ? dataStore().settings.xpMultiplier : 1; return (v > 0) ? v : 1; }
async function setXpMultiplierGlobal(mult) { await ensureDb(); dataStore().settings ||= {}; dataStore().settings.xpMultiplier = mult; scheduleDbWrite(); return mult; }
async function getChannelXpMultiplier(channelId) { await ensureDb(); if (channelId && dataStore().channelXpMultipliers && typeof dataStore().channelXpMultipliers[channelId] === 'number') { const v = dataStore().channelXpMultipliers[channelId]; return (v > 0) ? v : null; } return null; }
async function setChannelXpMultiplier(channelId, mult) { await ensureDb(); dataStore().channelXpMultipliers ||= {}; dataStore().channelXpMultipliers[channelId] = mult; scheduleDbWrite(); return mult; }
async function clearChannelXpMultiplier(channelId) { await ensureDb(); dataStore().channelXpMultipliers ||= {}; delete dataStore().channelXpMultipliers[channelId]; scheduleDbWrite(); }
async function setSchematicPanel(channelId, messageId) { await ensureDb(); dataStore().schematicPanels ||= {}; dataStore().schematicPanels[channelId] = messageId; scheduleDbWrite(); }
async function getSchematicPanel(channelId) { await ensureDb(); return dataStore().schematicPanels ? dataStore().schematicPanels[channelId] : null; }
async function clearSchematicPanel(channelId) { await ensureDb(); if (dataStore().schematicPanels) { delete dataStore().schematicPanels[channelId]; scheduleDbWrite(); } }

// --- MODERATION ---
async function addInfraction(userId, guildId, type) { await ensureDb(); const now = Date.now(); dataStore().infractions = dataStore().infractions.filter(i => now - i.timestamp < 3600000); dataStore().infractions.push({ userId, guildId, type, timestamp: now }); scheduleDbWrite(); return dataStore().infractions.filter(i => i.userId === userId && i.guildId === guildId && i.type === type).length; }
async function addWarning(userId, guildId, reason, moderatorId) { await ensureDb(); dataStore().warnings.push({ id: Date.now().toString()+Math.random(), userId, guildId, reason, moderatorId, timestamp: Date.now() }); scheduleDbWrite(); return dataStore().warnings.filter(w => w.userId === userId && w.guildId === guildId).length; }
async function getWarningCount(userId, guildId) { await ensureDb(); return dataStore().warnings.filter(w => w.userId === userId && w.guildId === guildId).length; }
async function removeWarning(userId, guildId, index) { await ensureDb(); const list = dataStore().warnings.filter(w => w.userId === userId && w.guildId === guildId); if (!list.length) return false; const target = index ? list[index-1] : list[list.length-1]; if(target) { dataStore().warnings = dataStore().warnings.filter(w => w.id !== target.id); scheduleDbWrite(); return true; } return false; }
async function addStrike(userId, guildId, reason, moderatorId) { await ensureDb(); dataStore().strikes.push({ id: Date.now().toString()+Math.random(), userId, guildId, reason, moderatorId, timestamp: Date.now() }); scheduleDbWrite(); return dataStore().strikes.filter(s => s.userId === userId && s.guildId === guildId).length; }
async function removeStrike(userId, guildId, index) { await ensureDb(); const list = dataStore().strikes.filter(s => s.userId === userId && s.guildId === guildId); if (!list.length) return false; const target = index ? list[index-1] : list[list.length-1]; if(target) { dataStore().strikes = dataStore().strikes.filter(s => s.id !== target.id); scheduleDbWrite(); return true; } return false; }
async function getStrikeCount(userId, guildId) { await ensureDb(); return dataStore().strikes.filter(s => s.userId === userId && s.guildId === guildId).length; }
function normalizeVouchEntry(x) {
  // Back-compat: old format stored voucherId as a string.
  if (!x) return null;
  if (typeof x === 'string') return { voucherId: x, reason: null, at: null };
  if (typeof x === 'object') {
    const voucherId = x.voucherId || x.userId || x.id || null;
    return { voucherId: voucherId ? String(voucherId) : null, reason: x.reason ? String(x.reason) : null, at: typeof x.at === 'number' ? x.at : null };
  }
  return null;
}

async function addVouch(staffId, guildId, voucherId, reason) {
  await ensureDb();
  let d = dataStore().vouches.find(v => v.userId === staffId && v.guildId === guildId);
  if (!d) { d = { userId: staffId, guildId, vouchers: [] }; dataStore().vouches.push(d); }

  const weekStart = (() => {
    const now = new Date();
    const d2 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    d2.setUTCDate(d2.getUTCDate() - d2.getUTCDay()); // Sunday
    return d2.getTime();
  })();

  // One vouch per voucher per week per target
  const existing = (d.vouchers || []).map(normalizeVouchEntry).filter(Boolean);
  const alreadyThisWeek = existing.some(v =>
    v.voucherId === String(voucherId) && (v.at || 0) >= weekStart
  );
  if (alreadyThisWeek) return false;

  (d.vouchers ||= []).push({ voucherId: String(voucherId), reason: reason ? String(reason).slice(0, 300) : null, at: Date.now() });
  scheduleDbWrite();
  return (d.vouchers || []).length;
}
async function getVouches(guildId) {
  await ensureDb();
  // Accept records from any guild — single-guild bots may have mismatched IDs
  const list = dataStore().vouches.filter(v => !v.guildId || v.guildId === guildId);
  for (const v of list) {
    v.vouchers = (v.vouchers || []).map(normalizeVouchEntry).filter(x => x && x.voucherId);
  }
  return list.sort((a,b)=>(b.vouchers?.length||0) - (a.vouchers?.length||0));
}
async function setVouchboard(guildId, channelId, messageId) { await ensureDb(); dataStore().vouchboard[guildId] = { channelId, messageId }; scheduleDbWrite(); }
async function getVouchboard(guildId) { await ensureDb(); return dataStore().vouchboard[guildId]; }

async function removeVouchUser(userId, guildId) {
  await ensureDb();
  const before = dataStore().vouches.length;
  dataStore().vouches = dataStore().vouches.filter(v => !(v.guildId === guildId && v.userId === userId));
  if (dataStore().vouches.length !== before) scheduleDbWrite();
  return true;
}

// --- NICKNAME OVERRIDES ---
async function setNickOverride(guildId, userId, name) {
  await ensureDb();
  dataStore().nickOverrides ||= {};
  dataStore().nickOverrides[guildId] ||= {};
  if (name === null || name === undefined || String(name).trim() === '') {
    delete dataStore().nickOverrides[guildId][userId];
  } else {
    dataStore().nickOverrides[guildId][userId] = String(name);
  }
  scheduleDbWrite();
  return (dataStore().nickOverrides[guildId] && dataStore().nickOverrides[guildId][userId]) ? dataStore().nickOverrides[guildId][userId] : null;
}
async function getNickOverride(guildId, userId) {
  await ensureDb();
  return (dataStore().nickOverrides && dataStore().nickOverrides[guildId]) ? (dataStore().nickOverrides[guildId][userId] || null) : null;
}

// --- VOUCH MUTATION HELPERS ---
async function addVouchesAmount(userId, guildId, amount) {
  await ensureDb();
  let d = dataStore().vouches.find(v => v.userId === userId && v.guildId === guildId);
  if (!d) { d = { userId, guildId, vouchers: [] }; dataStore().vouches.push(d); }
  const n = Math.max(0, parseInt(amount || 0, 10) || 0);
  for (let i = 0; i < n; i++) d.vouchers.push({ voucherId: `manual:${randomUUID()}`, reason: null, at: Date.now() });
  scheduleDbWrite();
  return d.vouchers.length;
}
async function removeVouchesAmount(userId, guildId, amount) {
  await ensureDb();
  let d = dataStore().vouches.find(v => v.userId === userId && v.guildId === guildId);
  if (!d) return 0;
  const n = Math.max(0, parseInt(amount || 0, 10) || 0);
  if (n <= 0) return d.vouchers.length;
  d.vouchers.splice(Math.max(0, d.vouchers.length - n), n);
  scheduleDbWrite();
  return d.vouchers.length;
}

// --- EVENTS ---
async function createGiveaway(g) { await ensureDb(); dataStore().giveaways.push(g); scheduleDbWrite(); return g; }
async function getActiveGiveaways() { await ensureDb(); return dataStore().giveaways.filter(g => !g.ended); }
async function getGiveaway(id) { await ensureDb(); return dataStore().giveaways.find(g => g.messageId === id); }
async function updateGiveaway(messageId, patch) {
  await ensureDb();
  const g = dataStore().giveaways.find(x => x.messageId === messageId);
  if (!g) return null;
  Object.assign(g, patch || {});
  scheduleDbWrite();
  return g;
}
async function addGiveawayEntry(id, uid) { await ensureDb(); const g = dataStore().giveaways.find(x => x.id === id); if(g && !g.entries.includes(uid)) { g.entries.push(uid); scheduleDbWrite(); return true; } return false; }
async function endGiveaway(id) { await ensureDb(); const g = dataStore().giveaways.find(x => x.messageId === id); if(g) { g.ended = true; scheduleDbWrite(); } return g; }
async function deleteGiveaway(id) { await ensureDb(); dataStore().giveaways = dataStore().giveaways.filter(g => g.messageId !== id); scheduleDbWrite(); }
async function listGiveaways(guildId) { await ensureDb(); let list = dataStore().giveaways; if (guildId) list = list.filter(g => g.guildId === guildId); return list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)); }
async function getLastEndedGiveaway(guildId) { await ensureDb(); const list = await listGiveaways(guildId); return list.find(g => g.ended) || null; }
async function addWatch(w) { await ensureDb(); dataStore().watches.push(w); scheduleDbWrite(); return w; }
async function getWatch(id) { await ensureDb(); return dataStore().watches.find(w => w.id === id); }
async function updateWatch(id, u) { await ensureDb(); const w = dataStore().watches.find(x => x.id === id); if(w) { Object.assign(w, u); scheduleDbWrite(); } return w; }
async function listWatching() { await ensureDb(); return dataStore().watches.filter(w => w.status === 'WATCHING'); }
async function addPayment(p) { await ensureDb(); dataStore().payments.push(p); scheduleDbWrite(); }
async function listPayments({ receiverIgn, limit }) { await ensureDb(); let l = dataStore().payments; if(receiverIgn) l = l.filter(p => p.receiver_ign.toLowerCase() === receiverIgn.toLowerCase()); return l.sort((a,b)=>b.paid_at-a.paid_at).slice(0,limit); }
async function addSchematic(s) { await ensureDb(); dataStore().schematics.push(s); scheduleDbWrite(); return s; }
async function getSchematic(id) { await ensureDb(); return dataStore().schematics.find(x => x.id === id); }
async function listSchematics() { await ensureDb(); return [...dataStore().schematics].sort((a,b)=>(a.name||'').localeCompare(b.name||'')); }
async function removeSchematic(id) { await ensureDb(); const before = dataStore().schematics.length; dataStore().schematics = dataStore().schematics.filter(x => x.id !== id); scheduleDbWrite(); return dataStore().schematics.length !== before; }

async function updateSchematic(id, patch) {
  await ensureDb();
  const s = dataStore().schematics.find(x => x.id === id);
  if (!s) return null;
  Object.assign(s, patch || {});
  scheduleDbWrite();
  return s;
}



// --- TICKETS + APPLICATIONS ---
function ensureTicketSystemDefaults(ds) {
  ds.ticketSystem ||= {
    config: {
      transcriptChannelId: '1467509143844950207',
      logChannelId: '1467509143844950207',
      applicationsReviewChannelId: '1472629126652366868',
      transcriptLimit: 500,
      staffRoleIds: ['1468237823747293376','1472623228231876842','1472623563893768316'],
      oneOpenPerButton: true
    },
    panels: {},
    tickets: {},
    counters: { ticketSeq: 0 },
    applications: { types: {}, submissions: {} }
  };
  ds.ticketSystem.config ||= {};
  ds.ticketSystem.panels ||= {};
  ds.ticketSystem.tickets ||= {};
  ds.ticketSystem.counters ||= { ticketSeq: 0 };
  ds.ticketSystem.applications ||= { types: {}, submissions: {} };
  ds.ticketSystem.applications.types ||= {};
  ds.ticketSystem.applications.submissions ||= {};
}

async function getTicketSystem() { await ensureDb(); ensureTicketSystemDefaults(dataStore()); return dataStore().ticketSystem; }
async function getTicketConfig() { const ts = await getTicketSystem(); return ts.config; }
async function setTicketConfig(partial) { const ts = await getTicketSystem(); ts.config = { ...(ts.config||{}), ...(partial||{}) }; scheduleDbWrite(); return ts.config; }

async function listTicketPanels() { const ts = await getTicketSystem(); return ts.panels || {}; }
async function getTicketPanel(id) { const ts = await getTicketSystem(); return ts.panels?.[id] || null; }
async function setTicketPanel(id, panel) { const ts = await getTicketSystem(); ts.panels[id] = panel; scheduleDbWrite(); return panel; }
async function deleteTicketPanel(id) { const ts = await getTicketSystem(); if (!ts.panels?.[id]) return false; delete ts.panels[id]; scheduleDbWrite(); return true; }

async function nextTicketId() { const ts = await getTicketSystem(); const cur = Number(ts.counters.ticketSeq || 0); ts.counters.ticketSeq = (cur % 1000) + 1; scheduleDbWrite(); return ts.counters.ticketSeq; }

async function createTicketRecord(channelId, record) { const ts = await getTicketSystem(); ts.tickets[channelId] = record; scheduleDbWrite(); return record; }
async function getTicketRecord(channelId) { const ts = await getTicketSystem(); return ts.tickets?.[channelId] || null; }
async function updateTicketRecord(channelId, patch) { const ts = await getTicketSystem(); const r = ts.tickets?.[channelId]; if (!r) return null; Object.assign(r, patch||{}); scheduleDbWrite(); return r; }
async function deleteTicketRecord(channelId) { const ts = await getTicketSystem(); if (!ts.tickets?.[channelId]) return false; delete ts.tickets[channelId]; scheduleDbWrite(); return true; }

async function findOpenTicketByUserButton(guildId, userId, panelId, buttonId) {
  const ts = await getTicketSystem();
  const entries = Object.values(ts.tickets||{});
  return entries.find(t => t.guildId===guildId && t.creatorId===userId && t.panelId===panelId && t.buttonId===buttonId && t.status==='OPEN') || null;
}

// --- STAFF TICKET STATS ---
// ticketStats[guildId][staffId] = { closed, claimed, messageCount, responseTotalMs, responseCount }
function ensureTicketStatsRow(guildId, staffId) {
  dataStore().ticketStats ||= {};
  dataStore().ticketStats[guildId] ||= {};
  const existing = dataStore().ticketStats[guildId][staffId] || {};
  const row = {
    closed: Number(existing.closed || 0),
    claimed: Number(existing.claimed || 0),
    openCount: Number(existing.openCount || 0),
    renameCount: Number(existing.renameCount || 0),
    messageCount: Number(existing.messageCount || 0),
    responseTotalMs: Number(existing.responseTotalMs || 0),
    responseCount: Number(existing.responseCount || 0),
  };
  dataStore().ticketStats[guildId][staffId] = row;
  return row;
}

async function recordTicketResponse(guildId, staffId, ms) {
  await ensureDb();
  const row = ensureTicketStatsRow(guildId, staffId);
  row.responseTotalMs = (row.responseTotalMs || 0) + Math.max(0, Number(ms) || 0);
  row.responseCount = (row.responseCount || 0) + 1;
  scheduleDbWrite();
  return row;
}

async function recordTicketClosed(guildId, staffId) {
  await ensureDb();
  const row = ensureTicketStatsRow(guildId, staffId);
  row.closed = (row.closed || 0) + 1;
  scheduleDbWrite();
  return row;
}

async function recordTicketClaimed(guildId, staffId) {
  await ensureDb();
  const row = ensureTicketStatsRow(guildId, staffId);
  row.claimed = (row.claimed || 0) + 1;
  scheduleDbWrite();
  return row;
}

async function recordTicketOpened(guildId, staffId) {
  await ensureDb();
  const row = ensureTicketStatsRow(guildId, staffId);
  row.openCount = (row.openCount || 0) + 1;
  scheduleDbWrite();
  return row;
}

async function recordTicketRenamed(guildId, staffId) {
  await ensureDb();
  const row = ensureTicketStatsRow(guildId, staffId);
  row.renameCount = (row.renameCount || 0) + 1;
  scheduleDbWrite();
  return row;
}

async function recordTicketMessage(guildId, staffId) {
  await ensureDb();
  const row = ensureTicketStatsRow(guildId, staffId);
  row.messageCount = (row.messageCount || 0) + 1;
  scheduleDbWrite();
  return row;
}

async function getTicketStats(guildId) {
  await ensureDb();
  return dataStore().ticketStats?.[guildId] || {};
}

// Applications
async function listAppTypes() { const ts = await getTicketSystem(); return ts.applications.types || {}; }
async function getAppType(id) { const ts = await getTicketSystem(); return ts.applications.types?.[id] || null; }
async function setAppType(id, typeObj) { const ts = await getTicketSystem(); ts.applications.types[id]=typeObj; scheduleDbWrite(); return typeObj; }
async function deleteAppType(id) { const ts = await getTicketSystem(); if(!ts.applications.types?.[id]) return false; delete ts.applications.types[id]; scheduleDbWrite(); return true; }

async function createAppSubmission(appId, sub) { const ts = await getTicketSystem(); ts.applications.submissions[appId]=sub; scheduleDbWrite(); return sub; }
async function getAppSubmission(appId) { const ts = await getTicketSystem(); return ts.applications.submissions?.[appId] || null; }
async function updateAppSubmission(appId, patch) { const ts = await getTicketSystem(); const s = ts.applications.submissions?.[appId]; if(!s) return null; Object.assign(s, patch||{}); scheduleDbWrite(); return s; }


// --- DROPDOWN PANELS ---
async function getDropdownPanel(panelId) { await ensureDb(); return dataStore().dropdownPanels[panelId] || null; }
async function setDropdownPanel(panelId, panel) { await ensureDb(); dataStore().dropdownPanels[panelId] = panel; scheduleDbWrite(); return panel; }
async function listDropdownPanels() { await ensureDb(); return dataStore().dropdownPanels || {}; }



// --- GUILD THEME ---
async function setGuildTheme(guildId, theme) {
  await ensureDb();
  dataStore().guildThemes ||= {};
  dataStore().guildThemes[guildId] = String(theme || 'default');
  scheduleDbWrite();
  return dataStore().guildThemes[guildId];
}
async function getGuildTheme(guildId) {
  await ensureDb();
  return dataStore().guildThemes?.[guildId] || 'default';
}

// --- BUILDER WORK STATE ---
// builderWork[guildId][userId] = { ticketChannelId, etaEnd, startedAt, updatedAt }
async function setBuilderWork(guildId, userId, work) {
  await ensureDb();
  dataStore().builderWork ||= {};
  dataStore().builderWork[guildId] ||= {};
  if (work == null) {
    delete dataStore().builderWork[guildId][userId];
    scheduleDbWrite();
    return null;
  }
  dataStore().builderWork[guildId][userId] = { ...(dataStore().builderWork[guildId][userId]||{}), ...(work||{}), updatedAt: Date.now() };
  scheduleDbWrite();
  return dataStore().builderWork[guildId][userId];
}
async function getBuilderWork(guildId, userId) {
  await ensureDb();
  return dataStore().builderWork?.[guildId]?.[userId] || null;
}
async function listBuilderWork(guildId) {
  await ensureDb();
  return dataStore().builderWork?.[guildId] || {};
}

// --- BUILDER BOARD (AUTO-UPDATING MESSAGE) ---
// builderBoard[guildId] = { channelId, messageId, updatedAt }
async function setBuilderBoard(guildId, board) {
  await ensureDb();
  dataStore().builderBoard ||= {};
  if (board == null) {
    delete dataStore().builderBoard[guildId];
    scheduleDbWrite();
    return null;
  }
  dataStore().builderBoard[guildId] = {
    ...(dataStore().builderBoard[guildId] || {}),
    ...(board || {}),
    updatedAt: Date.now(),
  };
  scheduleDbWrite();
  return dataStore().builderBoard[guildId];
}
async function getBuilderBoard(guildId) {
  await ensureDb();
  return dataStore().builderBoard?.[guildId] || null;
}
async function listBuilderBoards() {
  await ensureDb();
  return dataStore().builderBoard || {};
}

// --- BUILD COMPLETIONS (proof) ---
// buildHistory[guildId] = [ { id, status, amount, builderIgn, customerIgn, receiverIgn, builderDiscordId, customerDiscordId, proofUrl, proofName, moderatorId, at } ]
// builderFinishedCounts[guildId][builderIgn] = number
// builderFinishedCountsById[guildId][discordId] = number
async function addBuildRecord(guildId, rec) {
  await ensureDb();
  dataStore().buildHistory ||= {};
  dataStore().buildHistory[guildId] ||= [];
  const row = {
    id: rec?.id || (Date.now().toString() + Math.random().toString(16).slice(2)),
    status: rec?.status || 'FINISHED',
    amount: rec?.amount ?? null,
    price: rec?.price ?? rec?.amount ?? null,
    name: rec?.name ?? null,
    builderIgn: rec?.builderIgn ? String(rec.builderIgn) : null,
    customerIgn: rec?.customerIgn ? String(rec.customerIgn) : null,
    receiverIgn: rec?.receiverIgn ? String(rec.receiverIgn) : null,
    builderDiscordId: rec?.builderDiscordId ? String(rec.builderDiscordId) : null,
    customerDiscordId: rec?.customerDiscordId ? String(rec.customerDiscordId) : null,
    proofUrl: rec?.proofUrl ? String(rec.proofUrl) : null,
    proofName: rec?.proofName ? String(rec.proofName) : null,
    moderatorId: rec?.moderatorId ? String(rec.moderatorId) : null,
    at: typeof rec?.at === 'number' ? rec.at : Date.now(),
  };
  dataStore().buildHistory[guildId].push(row);

  if (row.status === 'FINISHED' && row.builderIgn) {
    dataStore().builderFinishedCounts ||= {};
    dataStore().builderFinishedCounts[guildId] ||= {};
    dataStore().builderFinishedCounts[guildId][row.builderIgn] = (dataStore().builderFinishedCounts[guildId][row.builderIgn] || 0) + 1;
  }

  if (row.status === 'FINISHED' && row.builderDiscordId) {
    dataStore().builderFinishedCountsById ||= {};
    dataStore().builderFinishedCountsById[guildId] ||= {};
    dataStore().builderFinishedCountsById[guildId][row.builderDiscordId] = (dataStore().builderFinishedCountsById[guildId][row.builderDiscordId] || 0) + 1;
  }

  scheduleDbWrite();
  return row;
}

async function getBuilderFinishedCountsById(guildId) {
  await ensureDb();
  return dataStore().builderFinishedCountsById?.[guildId] || {};
}

async function listBuildRecordsByDiscord(guildId, discordId) {
  await ensureDb();
  const all = dataStore().buildHistory?.[guildId] || [];
  return all
    .filter(r => r.builderDiscordId === String(discordId))
    .sort((a, b) => (b.at || 0) - (a.at || 0));
}

async function listBuildRecords(guildId, opts) {
  await ensureDb();
  const all = dataStore().buildHistory?.[guildId] || [];
  const status = opts?.status ? String(opts.status) : null;
  const filtered = status ? all.filter(r => String(r.status) === status) : all;
  return filtered.slice().sort((a,b) => (b.at||0) - (a.at||0));
}

async function getBuilderFinishedCounts(guildId) {
  await ensureDb();
  return dataStore().builderFinishedCounts?.[guildId] || {};
}

// --- BUILD JOBS (/build start) ---
async function addBuildJob(job) {
  await ensureDb();
  dataStore().buildJobs ||= {};
  dataStore().buildJobs[job.id] = job;
  scheduleDbWrite();
  return job;
}

async function getBuildJob(id) {
  await ensureDb();
  return dataStore().buildJobs?.[id] || null;
}

async function updateBuildJob(id, patch) {
  await ensureDb();
  const j = dataStore().buildJobs?.[id];
  if (!j) return null;
  Object.assign(j, patch);
  scheduleDbWrite();
  return j;
}

async function deleteBuildJob(id) {
  await ensureDb();
  if (!dataStore().buildJobs?.[id]) return false;
  delete dataStore().buildJobs[id];
  scheduleDbWrite();
  return true;
}

async function listBuildJobs(statusFilter) {
  await ensureDb();
  const jobs = Object.values(dataStore().buildJobs || {});
  if (!statusFilter) return jobs;
  if (Array.isArray(statusFilter)) return jobs.filter(j => statusFilter.includes(j.status));
  return jobs.filter(j => j.status === statusFilter);
}

// ─── AUTONICK ───────────────────────────────────────────────────────────────
async function getAutoNickConfig(guildId) {
  await ensureDb();
  dataStore().autonick ||= {};
  dataStore().autonick[guildId] ||= {};
  return dataStore().autonick[guildId];
}
async function setAutoNickPrefix(guildId, roleId, prefix) {
  await ensureDb();
  dataStore().autonick ||= {};
  dataStore().autonick[guildId] ||= {};
  if (!prefix) delete dataStore().autonick[guildId][roleId];
  else dataStore().autonick[guildId][roleId] = prefix;
  scheduleDbWrite();
  return dataStore().autonick[guildId];
}
// Seed static prefixes into autonick for a guild (called once on ready)
async function seedAutoNickDefaults(guildId, staticEntries) {
  await ensureDb();
  dataStore().autonick ||= {};
  dataStore().autonick[guildId] ||= {};
  const existing = dataStore().autonick[guildId];
  let changed = false;
  for (const [roleId, prefix] of staticEntries) {
    if (!existing[roleId]) { existing[roleId] = prefix; changed = true; }
  }
  if (changed) scheduleDbWrite();
  return existing;
}

// ─── LOA ────────────────────────────────────────────────────────────────────
async function addLoa(entry) {
  await ensureDb();
  dataStore().loas ||= [];
  dataStore().loas.push(entry);
  scheduleDbWrite();
  return entry;
}
async function getLoas(guildId) {
  await ensureDb();
  return (dataStore().loas || []).filter(l => l.guildId === guildId && l.active);
}
async function revokeLoa(guildId, userId) {
  await ensureDb();
  const loa = (dataStore().loas || []).find(l => l.guildId === guildId && l.userId === userId && l.active);
  if (!loa) return false;
  loa.active = false; loa.revokedAt = Date.now();
  scheduleDbWrite(); return true;
}
async function getActiveLoa(guildId, userId) {
  await ensureDb();
  return (dataStore().loas || []).find(l => l.guildId === guildId && l.userId === userId && l.active) || null;
}

// ─── KELP FARM CATALOG ──────────────────────────────────────────────────────
async function addCatalogFarm(farm) {
  await ensureDb();
  dataStore().catalogFarms ||= [];
  dataStore().catalogFarms.push(farm);
  scheduleDbWrite(); return farm;
}
async function listCatalogFarms(category) {
  await ensureDb();
  let list = dataStore().catalogFarms || [];
  if (category) list = list.filter(f => f.category === category);
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}
async function getCatalogFarm(id) {
  await ensureDb();
  return (dataStore().catalogFarms || []).find(f => f.id === id) || null;
}
async function removeCatalogFarm(id) {
  await ensureDb();
  const before = (dataStore().catalogFarms || []).length;
  dataStore().catalogFarms = (dataStore().catalogFarms || []).filter(f => f.id !== id);
  scheduleDbWrite();
  return (dataStore().catalogFarms || []).length !== before;
}

async function updateCatalogFarm(id, patch) {
  await ensureDb();
  const farm = (dataStore().catalogFarms || []).find(f => f.id === id);
  if (!farm) return null;
  Object.assign(farm, patch);
  scheduleDbWrite();
  return farm;
}
async function getCatalogPrices(guildId) {
  await ensureDb();
  dataStore().catalogPrices ||= {};
  dataStore().catalogPrices[guildId] ||= { dried_kelp_block: 0, bone: 0, bone_block: 0, blaze_rod: 0 };
  return dataStore().catalogPrices[guildId];
}
async function setCatalogPrice(guildId, item, price) {
  await ensureDb();
  dataStore().catalogPrices ||= {};
  dataStore().catalogPrices[guildId] ||= {};
  dataStore().catalogPrices[guildId][item] = price;
  scheduleDbWrite();
}
async function getCatalogPanel(channelId) {
  await ensureDb();
  return (dataStore().catalogPanels || {})[channelId] || null;
}
async function setCatalogPanel(channelId, messageId) {
  await ensureDb();
  dataStore().catalogPanels ||= {};
  dataStore().catalogPanels[channelId] = messageId;
  scheduleDbWrite();
}

// ─── STAFF PAY ───────────────────────────────────────────────────────────────
async function getStaffPayData() {
  await ensureDb();
  dataStore().staffPay ||= { weekStart: 0, boardMessageId: null, members: {} };
  dataStore().staffPay.members ||= {};
  dataStore().staffPay.boardMessageId ??= null;
  return dataStore().staffPay;
}
async function setStaffPayWeekStart(ts) {
  await ensureDb();
  dataStore().staffPay ||= { weekStart: 0, boardMessageId: null, members: {} };
  dataStore().staffPay.weekStart = ts;
  scheduleDbWrite();
}
async function getStaffPayMember(userId) {
  await ensureDb();
  return dataStore().staffPay?.members?.[userId] || null;
}
async function setStaffPayMember(userId, patch) {
  await ensureDb();
  dataStore().staffPay ||= { weekStart: 0, boardMessageId: null, members: {} };
  dataStore().staffPay.members ||= {};
  // Strip legacy embedMessageId field — board now uses a single boardMessageId
  const { embedMessageId: _drop, ...cleanPatch } = patch;
  dataStore().staffPay.members[userId] = { ...(dataStore().staffPay.members[userId] || {}), ...cleanPatch };
  scheduleDbWrite();
  return dataStore().staffPay.members[userId];
}
async function getStaffPayBoardMessageId() {
  await ensureDb();
  return dataStore().staffPay?.boardMessageId || null;
}
async function setStaffPayBoardMessageId(msgId) {
  await ensureDb();
  dataStore().staffPay ||= { weekStart: 0, boardMessageId: null, members: {} };
  dataStore().staffPay.boardMessageId = msgId || null;
  scheduleDbWrite();
}
async function resetStaffPayWeek(newWeekStart) {
  await ensureDb();
  const members = dataStore().staffPay?.members || {};
  for (const [uid, rec] of Object.entries(members)) {
    const streak = rec.paid ? (rec.streak || 0) + 1 : 0;
    members[uid] = { paid: false, streak };
  }
  dataStore().staffPay = { weekStart: newWeekStart, boardMessageId: dataStore().staffPay?.boardMessageId || null, members };
  scheduleDbWrite();
}

// --- ACCEPTED STAFF LIST ---
async function getAcceptedStaffList() {
  await ensureDb();
  dataStore().staffList ||= { support: {}, builders: {}, supportMessageId: null, buildersMessageId: null };
  dataStore().staffList.support ||= {};
  dataStore().staffList.builders ||= {};
  dataStore().staffList.supportMessageId ??= null;
  dataStore().staffList.buildersMessageId ??= null;
  return dataStore().staffList;
}

async function setAcceptedStaffListEntry(kind, userId, entry) {
  await ensureDb();
  const key = kind === 'builder' ? 'builders' : 'support';
  const list = await getAcceptedStaffList();
  list[key][String(userId)] = { ...(list[key][String(userId)] || {}), ...(entry || {}), updatedAt: Date.now() };
  scheduleDbWrite();
  return list[key][String(userId)];
}

async function deleteAcceptedStaffListEntry(kind, userId) {
  await ensureDb();
  const key = kind === 'builder' ? 'builders' : 'support';
  const list = await getAcceptedStaffList();
  delete list[key][String(userId)];
  scheduleDbWrite();
}

async function setAcceptedStaffListMessageId(kind, messageId) {
  await ensureDb();
  const list = await getAcceptedStaffList();
  if (kind === 'builder') list.buildersMessageId = messageId || null;
  else list.supportMessageId = messageId || null;
  scheduleDbWrite();
}


async function getLoaConfig() {
  await ensureDb();
  dataStore().loa ||= { channelId: '', messageId: '', roleId: '' };
  dataStore().loa.channelId ||= '';
  dataStore().loa.messageId ||= '';
  dataStore().loa.roleId ||= '';
  return dataStore().loa;
}
async function setLoaConfig(patch) {
  await ensureDb();
  dataStore().loa ||= { channelId: '', messageId: '', roleId: '' };
  Object.assign(dataStore().loa, patch || {});
  dataStore().loa.channelId = String(dataStore().loa.channelId || '');
  dataStore().loa.messageId = String(dataStore().loa.messageId || '');
  dataStore().loa.roleId = String(dataStore().loa.roleId || '');
  scheduleDbWrite();
  return dataStore().loa;
}

// ─── SERVER CONFIG (replaces config.js — set via /set command) ───────────────
async function getConfigValue(guildId, key) {
  await ensureDb();
  dataStore().serverConfig ||= {};
  dataStore().serverConfig[guildId] ||= {};
  return dataStore().serverConfig[guildId][key] ?? null;
}
async function setConfigValue(guildId, key, value) {
  await ensureDb();
  dataStore().serverConfig ||= {};
  dataStore().serverConfig[guildId] ||= {};
  dataStore().serverConfig[guildId][key] = value;
  scheduleDbWrite();
}
async function getServerConfig(guildId) {
  await ensureDb();
  dataStore().serverConfig ||= {};
  return dataStore().serverConfig[guildId] || {};
}

// ─── AUTOMOD CONFIG ───────────────────────────────────────────────────────────
async function getAutomodConfig(guildId) {
  await ensureDb();
  dataStore().automodConfig ||= {};
  return dataStore().automodConfig[guildId] || null;
}
async function setAutomodConfig(guildId, patch) {
  await ensureDb();
  dataStore().automodConfig ||= {};
  dataStore().automodConfig[guildId] = { ...(dataStore().automodConfig[guildId] || {}), ...patch };
  scheduleDbWrite();
  return dataStore().automodConfig[guildId];
}

// ─── BUILD QUEUE ──────────────────────────────────────────────────────────────
async function setBuildRequest(id, data) {
  await ensureDb();
  dataStore().buildRequests ||= {};
  dataStore().buildRequests[id] = data;
  scheduleDbWrite();
}
async function getBuildRequest(id) {
  await ensureDb();
  return dataStore().buildRequests?.[id] || null;
}
async function listBuildRequests(guildId) {
  await ensureDb();
  const all = Object.values(dataStore().buildRequests || {});
  return guildId ? all.filter(r => r.guildId === guildId || !r.guildId) : all;
}
async function deleteBuildRequest(id) {
  await ensureDb();
  dataStore().buildRequests ||= {};
  delete dataStore().buildRequests[id];
  scheduleDbWrite();
}


module.exports = {
  init, getUserXp, addXp, setXp, getRank,
  flushNow,
  setPrestigeSince, getPrestigeSince, clearPrestige,
  setGuildTheme, getGuildTheme,
  setBuilderWork, getBuilderWork, listBuilderWork,
  setBuilderBoard, getBuilderBoard, listBuilderBoards,
  addBuildRecord, listBuildRecords, getBuilderFinishedCounts, getBuilderFinishedCountsById, listBuildRecordsByDiscord,
  addBuildJob, getBuildJob, updateBuildJob, deleteBuildJob, listBuildJobs,
  setAfk, clearAfk, getAfk,
  getReceiverIgn, getReceiverIgnGlobal, setReceiverIgnGlobal, setChannelReceiverIgn, clearChannelReceiverIgn,
  getXpMultiplierGlobal, setXpMultiplierGlobal, getChannelXpMultiplier, setChannelXpMultiplier, clearChannelXpMultiplier,
  setSchematicPanel, getSchematicPanel, clearSchematicPanel,
  addInfraction, addWarning, getWarningCount, removeWarning, addStrike, getStrikeCount, removeStrike,
  addVouch, addVouchesAmount, removeVouchesAmount, getVouches, setVouchboard, getVouchboard, setNickOverride, getNickOverride,
  removeVouchUser,
  createGiveaway, getActiveGiveaways, getGiveaway, updateGiveaway, addGiveawayEntry, endGiveaway, deleteGiveaway, listGiveaways, getLastEndedGiveaway,
  addWatch, getWatch, updateWatch, listWatching, addPayment, listPayments,
  addSchematic, getSchematic, listSchematics, removeSchematic, updateSchematic,
  getDropdownPanel, setDropdownPanel, listDropdownPanels,
  addSticky, getStickies, clearStickies, updateStickyMessageId, getStickyById, updateSticky,
  getTicketSystem, getTicketConfig, setTicketConfig,
  listTicketPanels, getTicketPanel, setTicketPanel, deleteTicketPanel,
  nextTicketId, createTicketRecord, getTicketRecord, updateTicketRecord, deleteTicketRecord, findOpenTicketByUserButton,
  recordTicketResponse, recordTicketClosed, recordTicketClaimed, recordTicketOpened, recordTicketRenamed, recordTicketMessage, getTicketStats,
  listAppTypes, getAppType, setAppType, deleteAppType, createAppSubmission, getAppSubmission, updateAppSubmission,
getAutoNickConfig, setAutoNickPrefix, seedAutoNickDefaults,
addLoa, getLoas, revokeLoa, getActiveLoa,
addCatalogFarm, listCatalogFarms, getCatalogFarm, removeCatalogFarm,
getCatalogPrices, setCatalogPrice, getCatalogPanel, setCatalogPanel, updateCatalogFarm,
getStaffPayData, setStaffPayWeekStart, getStaffPayMember, setStaffPayMember, resetStaffPayWeek,
getStaffPayBoardMessageId, setStaffPayBoardMessageId,
getAcceptedStaffList, setAcceptedStaffListEntry, deleteAcceptedStaffListEntry, setAcceptedStaffListMessageId,
getLoaConfig, setLoaConfig,
getConfigValue, setConfigValue, getServerConfig,
getAutomodConfig, setAutomodConfig,
setBuildRequest, getBuildRequest, listBuildRequests, deleteBuildRequest,
addTimedRole, getActiveTimedRole, revokeTimedRole, listTimedRoles, listExpiredTimedRoles,
};
