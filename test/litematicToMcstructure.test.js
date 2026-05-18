'use strict';

const test = require('node:test');
const assert = require('node:assert');
const nbt = require('prismarine-nbt');
const {
  buildMcstructure, translate, conversionWarnings,
} = require('../render-service/litematicToMcstructure');

test('translate: a plain block keeps its name and emits no states', () => {
  const r = translate('minecraft:stone', {});
  assert.strictEqual(r.name, 'minecraft:stone');
  assert.deepStrictEqual(r.states, {});
});

test('translate: name map rewrites diverging ids', () => {
  assert.strictEqual(translate('minecraft:cobweb', {}).name, 'minecraft:web');
  assert.strictEqual(translate('minecraft:note_block', {}).name, 'minecraft:noteblock');
});

test('translate: log axis becomes pillar_axis', () => {
  assert.strictEqual(translate('minecraft:oak_log', { axis: 'z' }).states.pillar_axis, 'z');
});

test('translate: stairs map facing+half to weirdo_direction+upside_down_bit', () => {
  const r = translate('minecraft:oak_stairs', { facing: 'north', half: 'top' });
  assert.strictEqual(r.states.weirdo_direction, 3);
  assert.strictEqual(r.states.upside_down_bit, 1);
});

test('translate: slab type maps to vertical_half, double maps to a double_slab id', () => {
  assert.strictEqual(
    translate('minecraft:oak_slab', { type: 'top' }).states['minecraft:vertical_half'], 'top',
  );
  assert.strictEqual(
    translate('minecraft:oak_slab', { type: 'double' }).name, 'minecraft:oak_double_slab',
  );
});

test('buildMcstructure: output round-trips as valid little-endian mcstructure NBT', async () => {
  const size = { x: 2, y: 1, z: 1 };
  const blocks = [
    { x: 0, y: 0, z: 0, name: 'minecraft:stone', properties: {} },
    { x: 1, y: 0, z: 0, name: 'minecraft:oak_stairs', properties: { facing: 'east', half: 'bottom' } },
  ];

  const buf = buildMcstructure(blocks, size);
  assert.ok(Buffer.isBuffer(buf) && buf.length > 0);

  const parsed = nbt.simplify((await nbt.parse(buf, 'little')).parsed);

  assert.strictEqual(parsed.format_version, 1);
  assert.deepStrictEqual(parsed.size, [2, 1, 1]);
  assert.deepStrictEqual(parsed.structure_world_origin, [0, 0, 0]);

  const indices = parsed.structure.block_indices;
  assert.strictEqual(indices.length, 2, 'two layers');
  assert.strictEqual(indices[0].length, 2, 'layer 0 spans the volume');
  assert.deepStrictEqual(indices[1], [-1, -1], 'layer 1 (water) is empty');

  const palette = parsed.structure.palette.default.block_palette;
  // Cell (0,0,0) -> index 0, cell (1,0,0) -> index 1.
  assert.strictEqual(palette[indices[0][0]].name, 'minecraft:stone');
  assert.strictEqual(palette[indices[0][1]].name, 'minecraft:oak_stairs');
  assert.strictEqual(palette[indices[0][1]].states.weirdo_direction, 0);
});

test('buildMcstructure: identical blocks share one palette entry', async () => {
  const size = { x: 2, y: 1, z: 1 };
  const blocks = [
    { x: 0, y: 0, z: 0, name: 'minecraft:stone', properties: {} },
    { x: 1, y: 0, z: 0, name: 'minecraft:stone', properties: {} },
  ];
  const parsed = nbt.simplify((await nbt.parse(buildMcstructure(blocks, size), 'little')).parsed);
  assert.strictEqual(parsed.structure.palette.default.block_palette.length, 1);
  assert.deepStrictEqual(parsed.structure.block_indices[0], [0, 0]);
});

test('buildMcstructure: rejects an over-large axis before allocating', () => {
  assert.throws(() => buildMcstructure([], { x: 5000, y: 1, z: 1 }), /axis limit/);
});

test('buildMcstructure: rejects an over-large bounding-box volume', () => {
  // Each axis is under the per-axis cap; the product blows the volume cap.
  // This is the far-apart-regions OOM case — rejected before allocation.
  assert.throws(() => buildMcstructure([], { x: 4000, y: 4000, z: 4000 }), /cell limit/);
});

test('conversionWarnings: flags dropped entities and block entities', () => {
  assert.deepStrictEqual(conversionWarnings({ entityCount: 0, tileEntityCount: 0 }), []);
  const w = conversionWarnings({ entityCount: 2, tileEntityCount: 1 });
  assert.strictEqual(w.length, 2);
  assert.match(w[0], /2 entities/);
  assert.match(w[1], /1 block entity/);
});
