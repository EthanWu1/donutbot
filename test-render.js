'use strict';

const fs = require('fs');
const { renderLitematic, shutdown } = require('./lib/litematicRender/renderer');

(async () => {
  const file = process.argv[2];
  if (!file) { console.error('usage: node test-render.js <path-to-litematic>'); process.exit(1); }
  const buf = fs.readFileSync(file);
  console.log('rendering...');
  const t0 = Date.now();
  try {
    const { png, meta, diag, added, skipped, entityCount } = await renderLitematic(buf, { width: 1024, height: 1024 });
    fs.writeFileSync('test-render.png', png);
    console.log(`done in ${Date.now() - t0}ms`, meta);
    const entityDiag = diag?.entityRendering;
    const renderedEntities = Number(entityDiag?.renderedCount || 0);
    const skippedEntities = Number(entityDiag?.skippedDisabled || 0);
    console.log(`added=${added} skipped=${skipped} entitiesInFile=${entityCount} entitiesRendered=${renderedEntities}`);
    if (diag) {
      console.log('--- DIAG ---');
      if (entityDiag) {
        console.log('entity rendering disabled:', !!entityDiag.disabled);
        console.log('entities skipped by renderer:', skippedEntities);
      }
      console.log('unique block types:', diag.uniqueBlockTypes);
      console.log('missing definitions:', diag.missingDefinitionsCount);
      if (diag.missingDefinitions && diag.missingDefinitions.length) {
        console.log('missing:', diag.missingDefinitions);
      }
      if (diag.skipReasons && Object.keys(diag.skipReasons).length) {
        console.log('skip reasons:', diag.skipReasons);
      }
      console.log('top 15 block types:', diag.topBlockTypes);
    }
    console.log('saved to test-render.png');
  } finally {
    await shutdown();
  }
})();
