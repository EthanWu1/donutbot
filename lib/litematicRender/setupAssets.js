'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const ASSET_DIR = path.join(__dirname, 'assets');
const FILES = [
  {
    name: 'atlas.png',
    url: 'https://raw.githubusercontent.com/misode/mcmeta/atlas/all/atlas.png',
  },
  {
    name: 'atlas_index.json',
    url: 'https://raw.githubusercontent.com/misode/mcmeta/atlas/all/data.min.json',
  },
  {
    name: 'blockstates.json',
    url: 'https://raw.githubusercontent.com/misode/mcmeta/summary/assets/block_definition/data.min.json',
  },
  {
    name: 'models.json',
    url: 'https://raw.githubusercontent.com/misode/mcmeta/summary/assets/model/data.min.json',
  },
];

function download(url, outPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outPath);
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(outPath);
        return resolve(download(res.headers.location, outPath));
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(outPath);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', (e) => {
      file.close();
      try { fs.unlinkSync(outPath); } catch (_) {}
      reject(e);
    });
  });
}

async function ensureAssets({ force = false } = {}) {
  if (!fs.existsSync(ASSET_DIR)) fs.mkdirSync(ASSET_DIR, { recursive: true });

  for (const f of FILES) {
    const out = path.join(ASSET_DIR, f.name);
    if (!force && fs.existsSync(out) && fs.statSync(out).size > 0) continue;
    process.stdout.write(`[litematicRender] downloading ${f.name} ... `);
    await download(f.url, out);
    process.stdout.write('ok\n');
  }
}

module.exports = { ensureAssets, ASSET_DIR };

if (require.main === module) {
  const force = process.argv.includes('--force');
  ensureAssets({ force })
    .then(() => console.log('[litematicRender] assets ready at', ASSET_DIR))
    .catch((e) => { console.error('[litematicRender] setup failed:', e); process.exit(1); });
}
