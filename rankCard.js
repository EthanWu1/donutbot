let createCanvas, loadImage;
try { ({ createCanvas, loadImage } = require('@napi-rs/canvas')); }
catch { ({ createCanvas, loadImage } = require('canvas')); }
const { sanitizeDisplayName } = require('./utils');

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function fmt(n) {
  const x = Number.isFinite(n) ? Math.floor(n) : 0;
  return x.toLocaleString('en-US');
}

function fittedText(ctx, text, maxWidth, opts = {}) {
  const {
    startSize = 24,
    minSize = 14,
    weight = 700,
    family = '"DejaVu Sans", "Segoe UI", Arial, sans-serif',
  } = opts;

  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return { text, size };
    size -= 1;
  }

  ctx.font = `${weight} ${minSize}px ${family}`;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
  return { text: `${out}…`, size: minSize };
}

function drawGrid(ctx, width, height, color, alpha = 0.12, step = 26) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let x = -height; x < width + height; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }
  for (let x = 0; x < width + height; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x - height, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBlockFrame(ctx, x, y, w, h, c1, c2) {
  ctx.save();
  ctx.strokeStyle = c1;
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = c2;
  ctx.lineWidth = 2;
  const notch = 16;
  [[x,y],[x+w-notch,y],[x,y+h-notch],[x+w-notch,y+h-notch]].forEach(([nx,ny]) => {
    ctx.strokeRect(nx, ny, notch, notch);
  });
  ctx.restore();
}

function drawSculkBlocks(ctx, width, height, accent) {
  const blocks = [
    [26, 22, 18], [72, 30, 12], [612, 26, 16], [664, 34, 12],
    [40, 176, 14], [86, 188, 10], [596, 176, 16], [646, 186, 12]
  ];
  ctx.save();
  for (const [x,y,s] of blocks) {
    ctx.fillStyle = 'rgba(12, 24, 28, 0.9)';
    ctx.fillRect(x, y, s, s);
    ctx.strokeStyle = 'rgba(110, 231, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(x + 3, y + 3, s - 6, s - 6);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}


function drawPixelClusters(ctx, width, height, accent) {
  const clusters = [
    [24, 24, 4, 3], [590, 22, 5, 4], [44, 166, 3, 4], [618, 160, 4, 3],
    [210, 20, 3, 2], [480, 182, 3, 2], [316, 174, 2, 2]
  ];
  ctx.save();
  for (const [x, y, w, h] of clusters) {
    for (let ix = 0; ix < w; ix++) {
      for (let iy = 0; iy < h; iy++) {
        const px = x + ix * 6;
        const py = y + iy * 6;
        ctx.fillStyle = (ix + iy) % 2 === 0 ? 'rgba(8,20,24,0.95)' : 'rgba(16,34,40,0.9)';
        ctx.fillRect(px, py, 5, 5);
        ctx.fillStyle = accent;
        ctx.globalAlpha = ((ix + iy) % 3 === 0) ? 0.22 : 0.08;
        ctx.fillRect(px + 1, py + 1, 3, 3);
        ctx.globalAlpha = 1;
      }
    }
  }
  ctx.restore();
}

function drawSculkVeins(ctx, width, height, p) {
  const lines = [
    [140, 42, 250, 88], [510, 44, 620, 98], [126, 198, 250, 154], [472, 192, 624, 148]
  ];
  ctx.save();
  ctx.lineWidth = 4;
  ctx.lineCap = 'square';
  for (const [x1, y1, x2, y2] of lines) {
    ctx.strokeStyle = 'rgba(18, 32, 36, 0.95)';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1 + 2, y1 + 2);
    ctx.lineTo(x2 - 2, y2 - 2);
    ctx.stroke();
    ctx.lineWidth = 4;
  }
  ctx.restore();
}

function drawSegmentedBar(ctx, x, y, w, h, pct, p) {
  const segs = 22;
  const gap = 3;
  const segW = Math.floor((w - gap * (segs - 1)) / segs);
  const filled = Math.max(1, Math.round(segs * pct));
  for (let i = 0; i < segs; i++) {
    const sx = x + i * (segW + gap);
    ctx.fillStyle = i < filled ? p.accent : 'rgba(255,255,255,0.07)';
    ctx.fillRect(sx, y, segW, h);
    if (i < filled) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(sx, y, segW, 3);
    }
  }
}
function paletteFor(theme, accent) {
  const palettes = {
    ancient_city: {
      accent: accent || '#22d3ee',
      accentSoft: '#67e8f9',
      bg0: '#061015',
      bg1: '#0a171c',
      bg2: '#10242b',
      line: '#5eead4',
      panel: 'rgba(8, 18, 22, 0.84)',
      wedge: 'rgba(3, 10, 12, 0.76)',
    },
    nether: {
      accent: accent || '#fb7185',
      accentSoft: '#fda4af',
      bg0: '#140707',
      bg1: '#231010',
      bg2: '#301717',
      line: '#f87171',
      panel: 'rgba(25, 9, 9, 0.82)',
      wedge: 'rgba(9, 2, 2, 0.7)',
    },
    end: {
      accent: accent || '#c084fc',
      accentSoft: '#ddd6fe',
      bg0: '#0b0912',
      bg1: '#151225',
      bg2: '#221d35',
      line: '#a78bfa',
      panel: 'rgba(14, 12, 25, 0.82)',
      wedge: 'rgba(6, 5, 11, 0.72)',
    },
    default: {
      accent: accent || '#14b8a6',
      accentSoft: '#5eead4',
      bg0: '#0c1114',
      bg1: '#111a1f',
      bg2: '#18252b',
      line: '#2dd4bf',
      panel: 'rgba(12, 18, 22, 0.82)',
      wedge: 'rgba(5, 9, 11, 0.72)',
    },
  };
  return palettes[String(theme || 'default')] || palettes.default;
}

async function drawAvatar(ctx, userOrMember, x, y, size, ringColor) {
  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.save();
  ctx.shadowColor = ringColor;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2 + 5, 0, Math.PI * 2);
  ctx.fillStyle = ringColor;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.clip();
  try {
    const u = userOrMember.user || userOrMember;
    const avatar = await loadImage(u.displayAvatarURL({ extension: 'png', size: 256 }));
    ctx.drawImage(avatar, x, y, size, size);
  } catch {
    const fallback = ctx.createLinearGradient(x, y, x + size, y + size);
    fallback.addColorStop(0, '#334155');
    fallback.addColorStop(1, '#0f172a');
    ctx.fillStyle = fallback;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}


function normalizeTierName(name) {
  const raw = String(name || '').trim();
  if (!raw) return 'COMMON';
  return raw.toUpperCase().replace(/\s+/g, ' ');
}

function paletteForTierLabel(name, fallbackRank = 0) {
  const label = normalizeTierName(name);
  const byName = {
    'COMMON': { name: 'COMMON', accent: '#94a3b8', accentSoft: '#f1f5f9', glow: 'rgba(148,163,184,0.22)' },
    'UNCOMMON': { name: 'UNCOMMON', accent: '#22c55e', accentSoft: '#dcfce7', glow: 'rgba(34,197,94,0.32)' },
    'RARE': { name: 'RARE', accent: '#2563eb', accentSoft: '#bfdbfe', glow: 'rgba(37,99,235,0.38)' },
    'EPIC': { name: 'EPIC', accent: '#7c3aed', accentSoft: '#e9d5ff', glow: 'rgba(124,58,237,0.46)' },
    'LEGENDARY': { name: 'LEGENDARY', accent: '#f59e0b', accentSoft: '#fef3c7', glow: 'rgba(245,158,11,0.56)' },
    'MYTHIC': { name: 'MYTHIC', accent: '#ec4899', accentSoft: '#fbcfe8', glow: 'rgba(236,72,153,0.60)' },
  };
  return byName[label] || tierForRank(fallbackRank);
}

function styleForTierValue(tierValue) {
  const v = Number(tierValue) || 0;
  const styles = {
    1:   { code: 'T1',  accent: '#9ca3af', accentSoft: '#f8fafc', glow: 'rgba(156,163,175,0.22)', borderAlpha: 0.24, pattern: 'grid',      badgeDots: 1, sideBars: false, starCount: 0, avatarMarks: 0, chipIcon: null,       chipGlow: false },
    5:   { code: 'T2',  accent: '#22c55e', accentSoft: '#dcfce7', glow: 'rgba(34,197,94,0.30)',  borderAlpha: 0.34, pattern: 'ticks',     badgeDots: 2, sideBars: true,  starCount: 0, avatarMarks: 2, chipIcon: '+',       chipGlow: false },
    10:  { code: 'T3',  accent: '#2563eb', accentSoft: '#dbeafe', glow: 'rgba(37,99,235,0.36)',  borderAlpha: 0.48, pattern: 'chevrons',  badgeDots: 2, sideBars: true,  starCount: 2, avatarMarks: 4, chipIcon: '◆',      chipGlow: false },
    20:  { code: 'T4',  accent: '#7c3aed', accentSoft: '#ede9fe', glow: 'rgba(124,58,237,0.42)', borderAlpha: 0.58, pattern: 'diamonds',  badgeDots: 3, sideBars: true,  starCount: 4, avatarMarks: 5, chipIcon: '✦',      chipGlow: true  },
    35:  { code: 'T5',  accent: '#f59e0b', accentSoft: '#fef3c7', glow: 'rgba(245,158,11,0.50)', borderAlpha: 0.68, pattern: 'crown',     badgeDots: 3, sideBars: true,  starCount: 5, avatarMarks: 6, chipIcon: '✦✦',    chipGlow: true  },
    50:  { code: 'T6',  accent: '#ef4444', accentSoft: '#fee2e2', glow: 'rgba(239,68,68,0.56)',  borderAlpha: 0.78, pattern: 'spikes',    badgeDots: 4, sideBars: true,  starCount: 6, avatarMarks: 7, chipIcon: '✹',      chipGlow: true  },
    75:  { code: 'T7',  accent: '#0ea5a4', accentSoft: '#ccfbf1', glow: 'rgba(14,165,164,0.54)', borderAlpha: 0.82, pattern: 'circuit',   badgeDots: 4, sideBars: true,  starCount: 6, avatarMarks: 8, chipIcon: '⌁',      chipGlow: true  },
    100: { code: 'T8',  accent: '#fde047', accentSoft: '#fef9c3', glow: 'rgba(253,224,71,0.66)', borderAlpha: 0.88, pattern: 'solar',     badgeDots: 5, sideBars: true,  starCount: 7, avatarMarks: 9, chipIcon: '☼',      chipGlow: true  },
    150: { code: 'T9',  accent: '#06b6d4', accentSoft: '#cffafe', glow: 'rgba(6,182,212,0.64)',  borderAlpha: 0.90, pattern: 'prism',     badgeDots: 5, sideBars: true,  starCount: 8, avatarMarks: 10, chipIcon: '◈',      chipGlow: true  },
    200: { code: 'T10', accent: '#8b5cf6', accentSoft: '#ede9fe', glow: 'rgba(139,92,246,0.70)', borderAlpha: 0.94, pattern: 'void',      badgeDots: 6, sideBars: true,  starCount: 9, avatarMarks: 11, chipIcon: '✶',      chipGlow: true  },
    300: { code: 'T11', accent: '#ffffff', accentSoft: '#f8fafc', glow: 'rgba(255,255,255,0.78)',borderAlpha: 0.98, pattern: 'celestial', badgeDots: 6, sideBars: true,  starCount: 10, avatarMarks: 12, chipIcon: '✧✦',    chipGlow: true  },
  };
  if (styles[v]) return { ...styles[v] };
  return null;
}

function tierConfig(name, tierValue = 0) {
  const exact = styleForTierValue(tierValue);
  if (exact) return exact;
  const label = normalizeTierName(name);
  const map = {
    'COMMON': { borderAlpha: 0.28, pattern: 'grid', badgeDots: 1, sideBars: false, starCount: 0, avatarMarks: 0, chipIcon: null, chipGlow: false },
    'UNCOMMON': { borderAlpha: 0.40, pattern: 'ticks', badgeDots: 2, sideBars: true, starCount: 0, avatarMarks: 2, chipIcon: '+', chipGlow: false },
    'RARE': { borderAlpha: 0.54, pattern: 'chevrons', badgeDots: 3, sideBars: true, starCount: 2, avatarMarks: 4, chipIcon: '◆', chipGlow: false },
    'EPIC': { borderAlpha: 0.66, pattern: 'diamonds', badgeDots: 4, sideBars: true, starCount: 4, avatarMarks: 6, chipIcon: '✦', chipGlow: true },
    'LEGENDARY': { borderAlpha: 0.82, pattern: 'crown', badgeDots: 5, sideBars: true, starCount: 6, avatarMarks: 8, chipIcon: '✦✦', chipGlow: true },
    'MYTHIC': { borderAlpha: 0.95, pattern: 'mythic', badgeDots: 6, sideBars: true, starCount: 8, avatarMarks: 10, chipIcon: '✧✦', chipGlow: true },
  };
  return map[label] || map['COMMON'];
}
function drawTierEffects(ctx, tier, x, y, w, h, avatarX, avatarY, avatarSize, p, tierValue = 0) {
  const cfg = tierConfig(tier.name, tierValue);
  ctx.save();
  ctx.strokeStyle = p.accent;
  ctx.globalAlpha = cfg.borderAlpha;
  ctx.lineWidth = 1.5;
  if (cfg.sideBars) {
    roundRect(ctx, 20, 20, 8, h - 40, 4);
    ctx.stroke();
    roundRect(ctx, w - 28, 20, 8, h - 40, 4);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = p.accentSoft;
  ctx.fillStyle = p.accentSoft;
  ctx.globalAlpha = 0.22;
  if (cfg.pattern === 'ticks') {
    for (const px of [188, 230, 272, 314]) {
      ctx.fillRect(px, 32, 18, 4);
      ctx.fillRect(px, h - 36, 18, 4);
    }
  } else if (cfg.pattern === 'chevrons') {
    for (const px of [182, 236, 290, 344]) {
      ctx.beginPath();
      ctx.moveTo(px, 36); ctx.lineTo(px + 14, 48); ctx.lineTo(px + 28, 36);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, h - 36); ctx.lineTo(px + 14, h - 48); ctx.lineTo(px + 28, h - 36);
      ctx.stroke();
    }
  } else if (cfg.pattern === 'diamonds') {
    for (const px of [188, 246, 304, 362]) {
      ctx.beginPath();
      ctx.moveTo(px + 10, 28); ctx.lineTo(px + 20, 38); ctx.lineTo(px + 10, 48); ctx.lineTo(px, 38); ctx.closePath(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px + 10, h - 28); ctx.lineTo(px + 20, h - 38); ctx.lineTo(px + 10, h - 48); ctx.lineTo(px, h - 38); ctx.closePath(); ctx.stroke();
    }
  } else if (cfg.pattern === 'crown') {
    for (const baseY of [34, h - 34]) {
      const sign = baseY < 100 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(190, baseY);
      ctx.lineTo(206, baseY + 10 * sign);
      ctx.lineTo(222, baseY);
      ctx.lineTo(238, baseY + 16 * sign);
      ctx.lineTo(254, baseY);
      ctx.lineTo(270, baseY + 10 * sign);
      ctx.lineTo(286, baseY);
      ctx.stroke();
    }
  } else if (cfg.pattern === 'spikes') {
    for (const px of [186, 224, 262, 300, 338]) {
      for (const py of [34, h - 34]) {
        const dir = py < 100 ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(px, py); ctx.lineTo(px + 8, py + 14 * dir); ctx.lineTo(px + 16, py);
        ctx.stroke();
      }
    }
  } else if (cfg.pattern === 'circuit') {
    for (const baseY of [34, h - 34]) {
      const dir = baseY < 100 ? 1 : -1;
      for (const px of [182, 236, 290, 344]) {
        ctx.beginPath();
        ctx.moveTo(px, baseY);
        ctx.lineTo(px + 18, baseY);
        ctx.lineTo(px + 18, baseY + 10 * dir);
        ctx.lineTo(px + 34, baseY + 10 * dir);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px + 34, baseY + 10 * dir, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (cfg.pattern === 'solar') {
    for (const cy of [38, h - 38]) {
      ctx.beginPath();
      ctx.arc(236, cy, 14, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        ctx.beginPath();
        ctx.moveTo(236 + Math.cos(a) * 18, cy + Math.sin(a) * 18);
        ctx.lineTo(236 + Math.cos(a) * 26, cy + Math.sin(a) * 26);
        ctx.stroke();
      }
    }
  } else if (cfg.pattern === 'prism') {
    for (const baseY of [30, h - 30]) {
      const dir = baseY < 100 ? 1 : -1;
      for (const px of [190, 252, 314]) {
        ctx.beginPath();
        ctx.moveTo(px, baseY);
        ctx.lineTo(px + 16, baseY + 18 * dir);
        ctx.lineTo(px - 16, baseY + 18 * dir);
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (cfg.pattern === 'void') {
    for (const cy of [38, h - 38]) {
      ctx.beginPath();
      ctx.arc(232, cy, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(232, cy, 18, Math.PI * 0.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(232, cy, 26, Math.PI * 0.45, Math.PI * 1.55);
      ctx.stroke();
    }
  } else if (cfg.pattern === 'celestial') {
    for (const cy of [38, h - 38]) {
      ctx.beginPath();
      ctx.arc(232, cy, 13, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i;
        ctx.beginPath();
        ctx.moveTo(232 + Math.cos(a) * 18, cy + Math.sin(a) * 18);
        ctx.lineTo(232 + Math.cos(a) * 30, cy + Math.sin(a) * 30);
        ctx.stroke();
      }
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + (Math.PI / 2) * i;
        ctx.beginPath();
        ctx.moveTo(232 + Math.cos(a) * 16, cy + Math.sin(a) * 16);
        ctx.lineTo(232 + Math.cos(a) * 24, cy + Math.sin(a) * 24);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  if (cfg.pattern === 'mythic' || cfg.pattern === 'void' || cfg.pattern === 'celestial') {
    ctx.save();
    const aura = ctx.createRadialGradient(w * 0.55, h * 0.5, 20, w * 0.55, h * 0.5, 240);
    aura.addColorStop(0, p.glow || p.accent);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = p.accentSoft;
  ctx.globalAlpha = 0.7;
  const cx = avatarX + avatarSize / 2;
  const cy = avatarY + avatarSize / 2;
  const radius = avatarSize / 2 + 12;
  for (let i = 0; i < cfg.avatarMarks; i++) {
    const a = (-Math.PI / 2) + (i * (Math.PI * 2 / cfg.avatarMarks));
    const mx = cx + Math.cos(a) * radius;
    const my = cy + Math.sin(a) * radius;
    ctx.beginPath();
    ctx.arc(mx, my, i % 2 === 0 ? 2.3 : 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = p.accentSoft;
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < cfg.starCount; i++) {
    const sx = 548 + (i % 5) * 26;
    const sy = 30 + Math.floor(i / 5) * 18;
    ctx.fillRect(sx, sy + 4, 8, 2);
    ctx.fillRect(sx + 3, sy + 1, 2, 8);
    if (cfg.pattern === 'solar' || cfg.pattern === 'celestial') {
      ctx.fillRect(sx + 1, sy + 2, 6, 4);
    }
  }
  ctx.restore();
}

function tierForRank(rank) {
  const r = Math.max(0, Number(rank) || 0);
  if (r === 1) return { name: 'LEGENDARY', accent: '#f59e0b', accentSoft: '#fef3c7', glow: 'rgba(245,158,11,0.56)' };
  if (r > 0 && r <= 3) return { name: 'EPIC', accent: '#7c3aed', accentSoft: '#e9d5ff', glow: 'rgba(124,58,237,0.46)' };
  if (r <= 10) return { name: 'RARE', accent: '#2563eb', accentSoft: '#bfdbfe', glow: 'rgba(37,99,235,0.38)' };
  if (r <= 25) return { name: 'UNCOMMON', accent: '#22c55e', accentSoft: '#dcfce7', glow: 'rgba(34,197,94,0.32)' };
  return { name: 'COMMON', accent: '#94a3b8', accentSoft: '#f1f5f9', glow: 'rgba(148,163,184,0.22)' };
}

function drawStripedProgress(ctx, x, y, w, h, pct, p) {
  ctx.save();
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.clip();

  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(x, y, w, h);

  const fillW = Math.max(0, Math.round(w * pct));
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, p.accent);
  grad.addColorStop(1, p.accentSoft);
  ctx.shadowColor = p.glow || p.accent;
  ctx.shadowBlur = 18;
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, fillW, h);
  ctx.shadowBlur = 0;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, fillW, h);
  ctx.clip();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#ffffff';
  for (let sx = x - 40; sx < x + fillW + 40; sx += 22) {
    ctx.beginPath();
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + 12, y + h);
    ctx.lineTo(sx + 30, y);
    ctx.lineTo(sx + 18, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x, y, Math.max(0, fillW), 3);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.25;
  roundRect(ctx, x + 0.625, y + 0.625, w - 1.25, h - 1.25, h / 2);
  ctx.stroke();
  ctx.restore();
}

async function generateRankCard({ userOrMember, rank, level, xpIntoLevel, xpNeeded, accent = null, theme = 'default', tierLabel = null, tierValue = 0 }) {
  const width = 760;
  const height = 240;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const pct = clamp((Number(xpIntoLevel) || 0) / Math.max(1, Number(xpNeeded) || 1), 0, 1);
  const exactStyle = styleForTierValue(tierValue);
  const tier = exactStyle ? { name: normalizeTierName(tierLabel || exactStyle.code), accent: exactStyle.accent, accentSoft: exactStyle.accentSoft, glow: exactStyle.glow } : (tierLabel ? paletteForTierLabel(tierLabel, rank) : tierForRank(rank));
  const p = paletteFor('default', accent || tier.accent);
  p.accentSoft = tier.accentSoft;
  p.glow = tier.glow;

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#0b1220');
  bg.addColorStop(0.52, '#111827');
  bg.addColorStop(1, '#162338');
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, width, height, 24);
  ctx.fill();

  ctx.save();
  roundRect(ctx, 0, 0, width, height, 24);
  ctx.clip();
  drawGrid(ctx, width, height, p.accent, 0.06, 30);
  const glow = ctx.createRadialGradient(width * 0.82, 30, 10, width * 0.82, 30, 220);
  glow.addColorStop(0, tier.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  ctx.fillStyle = 'rgba(6, 11, 20, 0.74)';
  roundRect(ctx, 14, 14, width - 28, height - 28, 20);
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  roundRect(ctx, 14.5, 14.5, width - 29, height - 29, 20);
  ctx.stroke();
  ctx.strokeStyle = p.accent;
  ctx.globalAlpha = 0.45;
  roundRect(ctx, 15.5, 15.5, width - 31, height - 31, 19);
  ctx.stroke();
  ctx.restore();

  const avatarSize = 92;
  const avatarX = 28;
  const avatarY = 64;
  await drawAvatar(ctx, userOrMember, avatarX, avatarY, avatarSize, p.accent);
  drawTierEffects(ctx, tier, 0, 0, width, height, avatarX, avatarY, avatarSize, p, tierValue);

  const cfg = tierConfig(tier.name, tierValue);
  const chipBase = String(tier.name || 'COMMON');
  const chipLabel = cfg.chipIcon ? `${cfg.chipIcon} ${chipBase}` : chipBase;
  ctx.font = '800 10px "DejaVu Sans", "Segoe UI Symbol", Arial, sans-serif';
  const tierMetrics = ctx.measureText(chipLabel);
  const tierW = Math.max(72, Math.min(92, Math.ceil(tierMetrics.width + 16)));
  const tierH = 20;
  const tierX = Math.round((avatarX + avatarSize / 2) - (tierW / 2));
  const tierY = 30;
  const chipGrad = ctx.createLinearGradient(tierX, tierY, tierX + tierW, tierY);
  chipGrad.addColorStop(0, p.accent);
  chipGrad.addColorStop(1, p.accentSoft);
  if (cfg.chipGlow) {
    ctx.save();
    ctx.shadowColor = p.glow || p.accent;
    ctx.shadowBlur = 12;
    ctx.fillStyle = chipGrad;
    roundRect(ctx, tierX, tierY, tierW, tierH, 10);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = chipGrad;
    roundRect(ctx, tierX, tierY, tierW, tierH, 10);
    ctx.fill();
  }
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < cfg.badgeDots; i++) ctx.fillRect(tierX + 8 + i * 10, tierY + 3, 4, 4);
  ctx.restore();
  ctx.fillStyle = '#071019';
  ctx.font = '800 10px "DejaVu Sans", "Segoe UI Symbol", Arial, sans-serif';
  const tierTextX = tierX + (tierW - tierMetrics.width) / 2;
  const tierTextY = tierY + 14;
  ctx.fillText(chipLabel, tierTextX, tierTextY);

  const leftX = 144;
  const topY = 72;
  const rightPad = 28;

  const levelLabel = `Lv. ${Number(level) || 0}`;
  ctx.font = '800 28px "DejaVu Sans", "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = p.accentSoft;
  const levelW = ctx.measureText(levelLabel).width;
  const levelX = width - rightPad - levelW;
  ctx.fillText(levelLabel, levelX, topY);

  const nameSource = userOrMember.displayName
    || userOrMember.globalName
    || userOrMember.username
    || (userOrMember.user && (userOrMember.user.globalName || userOrMember.user.username))
    || 'Unknown';
  const displayName = sanitizeDisplayName(nameSource, { maxLen: 28 });
  const fit = fittedText(ctx, displayName, Math.max(140, (levelX - 18) - leftX), { startSize: 30, minSize: 16, weight: 800 });
  ctx.font = `800 ${fit.size}px "DejaVu Sans", "Segoe UI", Arial, sans-serif`;
  ctx.fillStyle = '#eef8fb';
  ctx.fillText(fit.text, leftX, topY);

  ctx.font = '600 15px "DejaVu Sans", "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = 'rgba(225, 237, 242, 0.78)';
  ctx.fillText(`Rank #${rank || 0}`, leftX, topY + 26);

  const xpLabel = `${fmt(xpIntoLevel)} / ${fmt(xpNeeded)} XP`;
  const subt = `${Math.round(pct * 100)}% complete`;
  const xpW = ctx.measureText(xpLabel).width;
  ctx.fillText(xpLabel, width - rightPad - xpW, topY + 26);

  ctx.font = '500 13px "DejaVu Sans", "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = 'rgba(205, 222, 228, 0.58)';
  const subtW = ctx.measureText(subt).width;
  ctx.fillText(subt, width - rightPad - subtW, topY + 46);

  const barX = leftX;
  const barY = 126;
  const barW = width - rightPad - barX;
  const barH = 24;
  drawStripedProgress(ctx, barX, barY, barW, barH, pct, p);

  ctx.font = '700 13px "DejaVu Sans", "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#081014';
  ctx.fillText(`${Math.round(pct * 100)}%`, barX + 14, barY + 17);

  const chipY = 168;
  const chipGap = 12;
  const chips = [
    { label: 'CURRENT XP', value: fmt(xpIntoLevel) },
    { label: 'TO NEXT', value: fmt(Math.max(0, (Number(xpNeeded) || 0) - (Number(xpIntoLevel) || 0))) },
  ];
  let chipX = leftX;
  for (const chip of chips) {
    const labelFont = '600 11px "DejaVu Sans", "Segoe UI", Arial, sans-serif';
    const valueFont = '800 15px "DejaVu Sans", "Segoe UI", Arial, sans-serif';
    ctx.font = valueFont;
    const valueW = ctx.measureText(chip.value).width;
    ctx.font = labelFont;
    const labelW = ctx.measureText(chip.label).width;
    const chipW = Math.max(112, Math.ceil(Math.max(valueW, labelW) + 28));
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    roundRect(ctx, chipX, chipY, chipW, 30, 15);
    ctx.fill();
    ctx.fillStyle = 'rgba(210, 226, 231, 0.66)';
    ctx.font = labelFont;
    ctx.fillText(chip.label, chipX + 14, chipY + 12);
    ctx.fillStyle = '#eef8fb';
    ctx.font = valueFont;
    ctx.fillText(chip.value, chipX + 14, chipY + 26);
    chipX += chipW + chipGap;
  }

  return canvas.toBuffer('image/png');
}


module.exports = { generateRankCard };
