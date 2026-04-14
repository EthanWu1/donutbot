// utils.js — Minimal additions over original.
'use strict';

function parseNumber(str) {
  if (str == null) return NaN;
  const s = String(str).trim().toLowerCase().replace(/,/g,'');
  if (s.endsWith('b')) return parseFloat(s)*1e9;
  if (s.endsWith('m')) return parseFloat(s)*1e6;
  if (s.endsWith('k')) return parseFloat(s)*1e3;
  return parseFloat(s);
}

function parseDuration(str) {
  if (!str) return null;
  const match = str.match(/^(\d+(?:\.\d+)?)(s|m|h|d|w)$/i);
  if (!match) return null;
  const n = parseFloat(match[1]), u = match[2].toLowerCase();
  const map = { s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5 };
  return Math.floor(n * map[u]);
}

// XP → level formula (same as original — do NOT change if you have existing XP data)
function getXpForLevel(lvl) {
  if (lvl <= 0) return 0;
  return Math.floor(100 * Math.pow(lvl, 1.5));
}

function getLevelFromXp(xp) {
  let lvl = 0;
  while (getXpForLevel(lvl + 1) <= (xp ?? 0)) lvl++;
  return lvl;
}

function sanitizeDisplayName(name, opts = {}) {
  const maxLen = opts.maxLen ?? 32;
  return String(name ?? '').replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim().slice(0, maxLen);
}

module.exports = { parseNumber, parseDuration, getXpForLevel, getLevelFromXp, sanitizeDisplayName };
