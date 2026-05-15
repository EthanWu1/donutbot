'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { ensureAssets } = require('../lib/litematicRender/setupAssets');
const { getBrowserLaunchOptions } = require('../lib/litematicRender/renderer');

const VIEWER_URL = pathToFileURL(path.join(__dirname, '..', 'lib', 'litematicRender', 'viewer.html')).href;

let browser;
let page;

async function launchViewer() {
  await ensureAssets();
  const puppeteer = require('puppeteer');
  browser = await puppeteer.launch(await getBrowserLaunchOptions());
  page = await browser.newPage();
  page.on('pageerror', (err) => {
    throw err;
  });
  await page.goto(VIEWER_URL, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.__ready === true, { timeout: 30_000 });
}

test.before(launchViewer);

test.after(async () => {
  if (page) await page.close();
  if (browser) await browser.close();
});

async function renderPayload(payload, opts = {}) {
  const result = await page.evaluate(
    (p, o) => window.__renderLitematic(p, o),
    payload,
    { width: 192, height: 192, ...opts }
  );
  assert.equal(result.ok, true, result.error);
  return result;
}

async function pixelAlpha(dataUrl, x, y) {
  const image = await loadImage(dataUrl);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(x, y, 1, 1).data[3];
}

test('culls the top face of ice when water sits directly on it', async () => {
  const result = await renderPayload({
    name: 'water on ice',
    author: 'test',
    size: { x: 3, y: 2, z: 2 },
    blockCount: 5,
    blocks: [
      { x: 1, y: 0, z: 0, name: 'minecraft:blue_ice', properties: {} },
      { x: 1, y: 1, z: 0, name: 'minecraft:water', properties: { level: '0' } },
      { x: 1, y: 1, z: 1, name: 'minecraft:water', properties: { level: '0' } },
      { x: 0, y: 1, z: 0, name: 'minecraft:glass', properties: {} },
      { x: 0, y: 1, z: 1, name: 'minecraft:glass', properties: {} },
    ],
  });

  assert.ok(result.diag.waterCoveredTopCullCount >= 1);
  assert.ok(result.diag.waterCoveredTopCulledBlocks.includes('minecraft:blue_ice'));
});

test('renders exposed bubble-column walls while culling only connected faces', async () => {
  const blocks = [];
  for (let y = 0; y < 5; y += 1) {
    blocks.push({ x: 0, y, z: 0, name: 'minecraft:bubble_column', properties: { drag: 'true' } });
  }

  const result = await renderPayload({
    name: 'bubble column',
    author: 'test',
    size: { x: 1, y: 5, z: 1 },
    blockCount: blocks.length,
    blocks,
  });

  const bubbleStats = result.diag.fluidFaces.water.bySource.bubble_column;
  assert.equal(bubbleStats.verticalStill, 0);
  assert.equal(bubbleStats.verticalFlat, 4);
  assert.equal(bubbleStats.topStill, 1);
});

test('keeps exposed side walls for vertical water stacks while culling connected top faces', async () => {
  const blocks = [];
  for (let y = 0; y < 4; y += 1) {
    blocks.push({ x: 0, y, z: 0, name: 'minecraft:water', properties: { level: '0' } });
  }

  const result = await renderPayload({
    name: 'stacked water',
    author: 'test',
    size: { x: 1, y: 4, z: 1 },
    blockCount: blocks.length,
    blocks,
  });

  const waterStats = result.diag.fluidFaces.water.bySource.water;
  assert.equal(waterStats.verticalStill, 0);
  assert.equal(waterStats.verticalFlat, 4);
  assert.equal(waterStats.topStill, 1);
});

test('culls only the shared side face between horizontally adjacent water', async () => {
  const result = await renderPayload({
    name: 'horizontal water',
    author: 'test',
    size: { x: 2, y: 1, z: 1 },
    blockCount: 2,
    blocks: [
      { x: 0, y: 0, z: 0, name: 'minecraft:water', properties: { level: '0' } },
      { x: 1, y: 0, z: 0, name: 'minecraft:water', properties: { level: '0' } },
    ],
  });

  const waterStats = result.diag.fluidFaces.water.bySource.water;
  assert.equal(waterStats.verticalStill, 0);
  assert.equal(waterStats.verticalFlat, 4);
});

test('merges sloped flowing water side runs into continuous faces', async () => {
  const blocks = [];
  for (let x = 0; x < 4; x += 1) {
    blocks.push({ x, y: 0, z: 0, name: 'minecraft:water', properties: { level: String(x) } });
  }

  const result = await renderPayload({
    name: 'sloped flowing water run',
    author: 'test',
    size: { x: 4, y: 1, z: 1 },
    blockCount: blocks.length,
    blocks,
  });

  const waterStats = result.diag.fluidFaces.water.bySource.water;
  assert.equal(waterStats.verticalStill, 0);
  assert.equal(waterStats.verticalFlat, 4);
});

test('does not cull side faces for water cells touching only by a vertical step edge', async () => {
  const result = await renderPayload({
    name: 'stepped water edge',
    author: 'test',
    size: { x: 2, y: 2, z: 1 },
    blockCount: 2,
    blocks: [
      { x: 0, y: 1, z: 0, name: 'minecraft:water', properties: { level: '0' } },
      { x: 1, y: 0, z: 0, name: 'minecraft:water', properties: { level: '8' } },
    ],
  });

  const waterStats = result.diag.fluidFaces.water.bySource.water;
  assert.equal(waterStats.verticalFlat, 8);
});

test('uses an undarkened deepslate water tint for custom fluid meshes', async () => {
  const result = await renderPayload({
    name: 'water tint',
    author: 'test',
    size: { x: 1, y: 1, z: 1 },
    blockCount: 1,
    blocks: [
      { x: 0, y: 0, z: 0, name: 'minecraft:water', properties: { level: '0' } },
    ],
  });

  assert.deepEqual(result.diag.waterTintRgb, [63, 118, 228]);
  assert.equal(result.diag.waterTextureShade, 1);
  assert.equal(result.diag.waterTextureAlpha, 230);
});

test('supports transparent preview backgrounds', async () => {
  const result = await renderPayload({
    name: 'transparent background',
    author: 'test',
    size: { x: 1, y: 1, z: 1 },
    blockCount: 1,
    blocks: [
      { x: 0, y: 0, z: 0, name: 'minecraft:stone', properties: {} },
    ],
  }, { width: 96, height: 96, transparentBackground: true });

  assert.equal(result.diag.transparentBackground, true);
  assert.equal(await pixelAlpha(result.dataUrl, 0, 0), 0);
});

test('honey and soul sand render as solid blocks without opaque neighbor culling', async () => {
  const result = await renderPayload({
    name: 'solid non opaque blocks',
    author: 'test',
    size: { x: 2, y: 1, z: 1 },
    blockCount: 2,
    blocks: [
      { x: 0, y: 0, z: 0, name: 'minecraft:honey_block', properties: {} },
      { x: 1, y: 0, z: 0, name: 'minecraft:soul_sand', properties: {} },
    ],
  });

  assert.equal(result.diag.blockFlags.honey_block.opaque, false);
  assert.equal(result.diag.blockFlags.honey_block.semi_transparent, false);
  assert.equal(result.diag.blockFlags.soul_sand.opaque, false);
  assert.equal(result.diag.blockFlags.soul_sand.semi_transparent, false);
  assert.equal(result.diag.textureAlpha['block/honey_block_top'].min, 255);
  assert.equal(result.diag.textureAlpha['block/honey_block_top'].max, 255);
  assert.equal(result.diag.textureAlpha['block/honey_block_side'].min, 255);
  assert.equal(result.diag.textureAlpha['block/honey_block_side'].max, 255);
});

test('glass panes use default pane textures and render after water color', async () => {
  const result = await renderPayload({
    name: 'regular pane texture',
    author: 'test',
    size: { x: 2, y: 1, z: 1 },
    blockCount: 2,
    blocks: [
      { x: 1, y: 0, z: 0, name: 'minecraft:water', properties: { level: '0' } },
      { x: 0, y: 0, z: 0, name: 'minecraft:light_gray_stained_glass_pane', properties: {
        north: 'false', south: 'false', east: 'false', west: 'false', waterlogged: 'false',
      } },
    ],
  });

  assert.equal(
    result.diag.glassPaneTextures.light_gray_stained_glass_pane.edge,
    'minecraft:block/light_gray_stained_glass_pane_top'
  );
  assert.equal(result.diag.blockFlags.light_gray_stained_glass_pane.opaque, false);
  assert.equal(result.diag.blockFlags.light_gray_stained_glass_pane.semi_transparent, true);
  assert.equal(result.diag.transparentLayering.order, 'opaque,fluid-color,fluid-depth,transparent-detail');
  assert.ok(result.diag.transparentLayering.fluidQuads > 0);
  assert.ok(result.diag.transparentLayering.detailQuads > 0);
  assert.equal(result.diag.textureAlpha['block/light_gray_stained_glass_pane_top'].max, 230);
});

test('stained glass keeps vanilla texture alpha detail', async () => {
  const result = await renderPayload({
    name: 'default glass texture alpha',
    author: 'test',
    size: { x: 1, y: 1, z: 1 },
    blockCount: 1,
    blocks: [
      { x: 0, y: 0, z: 0, name: 'minecraft:light_gray_stained_glass', properties: {} },
    ],
  });

  assert.equal(result.diag.blockFlags.light_gray_stained_glass.opaque, false);
  assert.equal(result.diag.blockFlags.light_gray_stained_glass.semi_transparent, true);
  assert.equal(result.diag.textureAlpha['block/light_gray_stained_glass'].min, 102);
  assert.equal(result.diag.textureAlpha['block/light_gray_stained_glass'].max, 163);
});

test('keeps dense chunk meshes below the 16-bit WebGL index limit', async () => {
  const blocks = [];
  for (let x = 0; x < 16; x += 1) {
    for (let y = 0; y < 16; y += 1) {
      for (let z = 0; z < 16; z += 1) {
        blocks.push({
          x, y, z,
          name: 'minecraft:hopper',
          properties: { facing: 'down', enabled: 'true' },
        });
      }
    }
  }

  const result = await renderPayload({
    name: 'dense hoppers',
    author: 'test',
    size: { x: 16, y: 16, z: 16 },
    blockCount: blocks.length,
    blocks,
  }, { width: 96, height: 96 });

  assert.equal(result.diag.oversizedMeshCount, 0);
  assert.ok(result.diag.maxMeshQuadVertices > 0);
  assert.ok(result.diag.maxMeshQuadVertices < 65536);
});
