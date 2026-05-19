'use strict';

// litematic -> Bedrock .mcstructure bridge.
//
// HoloPrint only reads Bedrock .mcstructure exports; the schematic forum is all
// Java .litematic. This module reads a litematic (via the existing hardened
// reader) and assembles an equivalent .mcstructure NBT.
//
// Block translation prefers GeyserMC's authoritative Java->Bedrock mapping
// (see javaToBedrock.js). When that data is unavailable it falls back to the
// small built-in translation below — names plus axis/stairs/slabs only — so
// the bridge still works, just less faithfully. Block entities (sign text,
// chest contents, ...) are not carried over either way.

const nbt = require('prismarine-nbt');
const { readLitematic } = require('../lib/litematicRender/litematicReader');
const javaToBedrock = require('./javaToBedrock');

// Bedrock stamps every palette block with a state-schema version. It encodes
// the game version as (major<<24)|(minor<<16)|(patch<<8)|revision; 1.21.0 is
// 18153472. Bedrock's state upgrader runs from here, so a recent value keeps
// the modern flattened state names below intact. Bump it after a game update
// only if states stop translating cleanly.
const BLOCK_VERSION = 18153472;

// The output is two dense arrays of sx*sy*sz cells. readLitematic caps the
// summed *region* volume, but its reported size is the bounding box across
// non-air blocks — two tiny regions placed far apart stay under the region cap
// yet blow the bounding box up. These caps reject that before any allocation,
// so a crafted litematic cannot OOM the shared render service.
const MAX_OUTPUT_DIM = 4096;
const MAX_OUTPUT_VOLUME = 8_000_000;

// Java block id -> Bedrock block id, only where they still differ. Bedrock 1.21
// flattened most ids to match Java, so this list is deliberately short.
const NAME_MAP = {
  'minecraft:cobweb': 'minecraft:web',
  'minecraft:note_block': 'minecraft:noteblock',
  'minecraft:powered_rail': 'minecraft:golden_rail',
  'minecraft:sugar_cane': 'minecraft:reeds',
  'minecraft:lily_pad': 'minecraft:waterlily',
  'minecraft:nether_quartz_ore': 'minecraft:quartz_ore',
  'minecraft:snow': 'minecraft:snow_layer',
  'minecraft:snow_block': 'minecraft:snow',
  'minecraft:slime_block': 'minecraft:slime',
  'minecraft:magma_block': 'minecraft:magma',
  'minecraft:dirt_path': 'minecraft:grass_path',
};

// Java stair `facing` -> Bedrock `weirdo_direction`.
const STAIR_WEIRDO = { east: 0, west: 1, south: 2, north: 3 };

// NBT tag type for each Bedrock state key this module emits. Explicit because
// the wire type (string / int / byte) is not inferable from the value alone.
const STATE_TYPE = {
  pillar_axis: 'string',
  weirdo_direction: 'int',
  upside_down_bit: 'byte',
  'minecraft:vertical_half': 'string',
};

// Built-in fallback translation, used only when Geyser's mapping is
// unavailable. Java (name, properties) -> Bedrock { name, states }.
function translate(javaName, props = {}) {
  let name = NAME_MAP[javaName] || javaName;
  const states = {};

  // Logs, pillars, hay/bone blocks, etc. — Java `axis` -> Bedrock pillar_axis.
  if (props.axis === 'x' || props.axis === 'y' || props.axis === 'z') {
    states.pillar_axis = props.axis;
  }

  if (javaName.endsWith('_stairs')) {
    const w = STAIR_WEIRDO[props.facing];
    if (w !== undefined) states.weirdo_direction = w;
    states.upside_down_bit = props.half === 'top' ? 1 : 0;
  } else if (javaName.endsWith('_slab')) {
    if (props.type === 'double') {
      name = name.replace(/_slab$/, '_double_slab');
    } else {
      states['minecraft:vertical_half'] = props.type === 'top' ? 'top' : 'bottom';
    }
  }

  return { name, states };
}

const nbtInt = (value) => ({ type: 'int', value });
const nbtString = (value) => ({ type: 'string', value });
const intList = (value) => ({ type: 'list', value: { type: 'int', value } });

function encodeStates(states) {
  const out = {};
  for (const [k, v] of Object.entries(states)) {
    const type = STATE_TYPE[k] || (typeof v === 'number' ? 'int' : 'string');
    out[k] = { type, value: v };
  }
  return out;
}

// Java (name, properties) -> Bedrock { name, states } with NBT-typed states.
// Prefers Geyser's authoritative mapping; falls back to the built-in
// translation when the Geyser data is unavailable or a block is unmapped.
function convertBlock(javaName, props) {
  // A litematic captured while a piston was mid-cycle stores `moving_piston`
  // technical blocks. Bedrock's equivalent (`moving_block`) is not buildable
  // and HoloPrint draws it as an error cube — represent it as the piston at
  // rest so the hologram shows a placeable block.
  if (javaName === 'minecraft:moving_piston') {
    const sticky = props && props.type === 'sticky';
    javaName = sticky ? 'minecraft:sticky_piston' : 'minecraft:piston';
    props = { facing: (props && props.facing) || 'up', extended: 'false' };
  }

  const mapped = javaToBedrock.resolve(javaName, props);
  if (mapped) return mapped;
  const f = translate(javaName, props || {});
  return { name: f.name, states: encodeStates(f.states) };
}

// Assembles the .mcstructure NBT Buffer from re-based blocks (origin 0,0,0).
// blocks: [{ x, y, z, name, properties }]; size: { x, y, z }.
function buildMcstructure(blocks, size) {
  const sx = size.x;
  const sy = size.y;
  const sz = size.z;
  if (!(sx >= 1) || !(sy >= 1) || !(sz >= 1)) {
    throw new Error(`invalid structure size ${sx}x${sy}x${sz}`);
  }
  if (sx > MAX_OUTPUT_DIM || sy > MAX_OUTPUT_DIM || sz > MAX_OUTPUT_DIM) {
    throw new Error(`structure ${sx}x${sy}x${sz} exceeds the ${MAX_OUTPUT_DIM}-block axis limit`);
  }
  const volume = sx * sy * sz;
  if (volume > MAX_OUTPUT_VOLUME) {
    throw new Error(
      `structure bounding box (${volume.toLocaleString('en-US')} cells) exceeds the `
      + `${MAX_OUTPUT_VOLUME.toLocaleString('en-US')}-cell limit — litematics whose blocks `
      + 'span a huge volume (e.g. far-apart regions) are rejected',
    );
  }

  // Palette deduped by name + states.
  const paletteIndex = new Map();
  const paletteEntries = [];
  function indexOf(name, states) {
    const key = `${name}|${JSON.stringify(states)}`;
    let idx = paletteIndex.get(key);
    if (idx === undefined) {
      idx = paletteEntries.length;
      paletteEntries.push({ name, states });
      paletteIndex.set(key, idx);
    }
    return idx;
  }

  // Layer 0 holds the blocks; layer 1 is Bedrock's waterlogging layer. -1
  // marks an empty cell. mcstructure order is x-major, then y, then z.
  const layer0 = new Array(volume).fill(-1);
  const layer1 = new Array(volume).fill(-1);
  let waterIndex = -1;
  for (const b of blocks) {
    const { name, states } = convertBlock(b.name, b.properties);
    const idx = (b.x * sy + b.y) * sz + b.z;
    layer0[idx] = indexOf(name, states);
    // A waterlogged Java block carries its water in Bedrock's second layer.
    if (b.properties && b.properties.waterlogged === 'true') {
      if (waterIndex < 0) waterIndex = indexOf('minecraft:water', {});
      layer1[idx] = waterIndex;
    }
  }

  const blockPalette = paletteEntries.map((e) => ({
    name: nbtString(e.name),
    states: { type: 'compound', value: e.states },
    version: nbtInt(BLOCK_VERSION),
  }));

  const root = {
    type: 'compound',
    name: '',
    value: {
      format_version: nbtInt(1),
      size: intList([sx, sy, sz]),
      structure_world_origin: intList([0, 0, 0]),
      structure: {
        type: 'compound',
        value: {
          // A list of two int-lists. Each element is the inner list's bare
          // { type, value } — the outer list already declares element-type.
          block_indices: {
            type: 'list',
            value: {
              type: 'list',
              value: [
                { type: 'int', value: layer0 },
                { type: 'int', value: layer1 },
              ],
            },
          },
          entities: { type: 'list', value: { type: 'end', value: [] } },
          palette: {
            type: 'compound',
            value: {
              default: {
                type: 'compound',
                value: {
                  block_palette: {
                    type: 'list',
                    value: { type: 'compound', value: blockPalette },
                  },
                  block_position_data: { type: 'compound', value: {} },
                },
              },
            },
          },
        },
      },
    },
  };

  return nbt.writeUncompressed(root, 'little');
}

// Notes about source content the .mcstructure conversion cannot carry over,
// so callers surface it instead of returning a silently incomplete structure.
function conversionWarnings(lite) {
  const warnings = [];
  const ents = lite.entityCount || 0;
  const tiles = lite.tileEntityCount || 0;
  if (ents > 0) {
    warnings.push(`${ents} entit${ents === 1 ? 'y' : 'ies'} `
      + '(mobs, item frames, paintings, armor stands) were not converted.');
  }
  if (tiles > 0) {
    warnings.push(`${tiles} block entit${tiles === 1 ? 'y' : 'ies'} `
      + '(sign text, chest contents, banners) were not converted.');
  }
  return warnings;
}

// Full pipeline: raw .litematic bytes ->
// { mcstructure, name, size, blockCount, warnings }.
async function litematicToMcstructure(buffer) {
  const lite = await readLitematic(buffer);
  await javaToBedrock.init(); // load Geyser's mapping once; no-ops if absent
  return {
    mcstructure: buildMcstructure(lite.blocks, lite.size),
    name: lite.name,
    size: lite.size,
    blockCount: lite.blockCount,
    warnings: conversionWarnings(lite),
  };
}

module.exports = {
  litematicToMcstructure, buildMcstructure, translate, conversionWarnings,
};
