const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const dataFile = process.env.DATA_FILE ? path.resolve(process.env.DATA_FILE) : path.join(__dirname, 'data.json');
const backupDir = process.env.DATA_BACKUP_DIR ? path.resolve(process.env.DATA_BACKUP_DIR) : path.join(__dirname, 'backups');

async function readJson(file) {
  return JSON.parse(await fsp.readFile(file, 'utf8'));
}

async function inspect() {
  const data = await readJson(dataFile);
  const xp = Array.isArray(data.xp) ? data.xp : [];
  const summary = {
    file: dataFile,
    xpRows: xp.length,
    maxXp: Math.max(0, ...xp.map(x => Number(x.xp) || 0)),
    maxLevel: Math.max(0, ...xp.map(x => Number(x.level) || 0)),
    buildJobs: Object.keys(data.buildJobs || {}).length,
    buildRequests: Object.keys(data.buildRequests || {}).length,
    refunds: (data.refunds || []).length,
    giveaways: (data.giveaways || []).length,
    payments: (data.payments || []).length
  };
  console.log(JSON.stringify(summary, null, 2));
}

async function backup() {
  await fsp.mkdir(backupDir, { recursive: true });
  const out = path.join(backupDir, `manual-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await fsp.copyFile(dataFile, out);
  console.log(out);
}

async function restore(src) {
  if (!src) throw new Error('Usage: node data-tools.js restore <backup-file>');
  const resolved = path.resolve(src);
  if (!fs.existsSync(resolved)) throw new Error(`Backup not found: ${resolved}`);
  const incoming = await readJson(resolved);
  if (!Array.isArray(incoming.xp)) throw new Error('Refusing restore: backup has no xp array.');
  await backup();
  await fsp.copyFile(resolved, dataFile);
  console.log(`Restored ${resolved} -> ${dataFile}`);
}

(async () => {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'inspect') return inspect();
  if (cmd === 'backup') return backup();
  if (cmd === 'restore') return restore(arg);
  throw new Error('Usage: node data-tools.js <inspect|backup|restore> [file]');
})().catch(err => {
  console.error(err.message);
  process.exitCode = 1;
});
