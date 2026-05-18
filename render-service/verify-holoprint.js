'use strict';

// End-to-end check for the headless HoloPrint pipeline. Builds a tiny
// .mcstructure, runs it through the vendored HoloPrint app in Chromium, and
// confirms a real .holoprint.mcpack (a zip) comes back. Needs the vendored
// HoloPrint src and outbound network (esm.sh + jsdelivr).
//
//   node render-service/verify-holoprint.js

const fs = require('fs');
const path = require('path');
const { buildMcstructure } = require('./litematicToMcstructure');
const { makeHoloprintPack, shutdown } = require('./holoprintRenderer');

(async () => {
  const size = { x: 3, y: 1, z: 3 };
  const blocks = [];
  for (let x = 0; x < size.x; x++) {
    for (let z = 0; z < size.z; z++) {
      const name = x === 1 && z === 1 ? 'minecraft:oak_planks' : 'minecraft:stone';
      blocks.push({ x, y: 0, z, name, properties: {} });
    }
  }
  const mcstructure = buildMcstructure(blocks, size);
  console.log(`built test .mcstructure: ${mcstructure.length} bytes, ${blocks.length} blocks`);

  const t0 = Date.now();
  const { pack, packName } = await makeHoloprintPack(mcstructure, 'verify-test');
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  const isZip = pack.length >= 4 && pack[0] === 0x50 && pack[1] === 0x4b
    && pack[2] === 0x03 && pack[3] === 0x04;
  const outPath = path.join(__dirname, 'verify-output.mcpack');
  fs.writeFileSync(outPath, pack);

  console.log(`pack name : ${packName}`);
  console.log(`pack size : ${pack.length} bytes`);
  console.log(`zip magic : ${isZip}`);
  console.log(`elapsed   : ${secs}s`);
  console.log(`written   : ${outPath}`);

  await shutdown();

  if (!isZip || pack.length < 200 || !/\.holoprint\.mcpack$/.test(packName || '')) {
    console.error('FAIL: output is not a plausible HoloPrint pack');
    process.exit(1);
  }
  console.log('PASS: headless HoloPrint produced a valid .holoprint.mcpack');
  process.exit(0);
})().catch((err) => {
  console.error('ERROR:', err && err.stack ? err.stack : err);
  process.exit(1);
});
