'use strict';

// litematic -> Bedrock .mcstructure bridge.
//
// HoloPrint only reads Bedrock .mcstructure exports; the schematic forum is all
// Java .litematic. This module reads a litematic (via the existing hardened
// reader) and assembles an equivalent .mcstructure NBT.
//
// Block translation is BEST-EFFORT, as agreed in the plan: Bedrock 1.21
// flattened most block ids to match Java, so plain blocks convert exactly.
// For the families whose Bedrock state schema is stable and well known
// (logs/pillars, stairs, slabs) the orientation states are translated; every
// other Java property is dropped so the block falls back to its Bedrock
// default. Dropping a state is a safe miss — emitting an unknown state can make
// Bedrock reject the block outright. Final correctness is verified in-game.

const nbt = require('prismarine-nbt');
const { readLitematic } = require('../lib/litematicRender/litematicReader');

// Bedrock stamps every palette block with a state-schema version. It encodes
// the game version as (major<<24)|(minor<<16)|(patch<<8)|revision; 1.21.0 is
// 18153472. Bedrock's state upgrader runs from here, so a recent value keeps
// the modern flattened state names below intact. Bump it after a game update
// only if states stop translating cleanly.
const BLOCK_VERSION = 18153472;

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

// Java (name, properties) -> Bedrock { name, states }.
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

// Assembles the .mcstructure NBT Buffer from re-based blocks (origin 0,0,0).
// blocks: [{ x, y, z, name, properties }]; size: { x, y, z }.
function buildMcstructure(blocks, size) {
  const sx = size.x;
  const sy = size.y;
  const sz = size.z;
  const volume = sx * sy * sz;

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

  // Layer 0 holds the blocks; layer 1 is Bedrock's waterlogging layer, left
  // empty. -1 marks a cell with no block. mcstructure order is x-major,
  // then y, then z.
  const layer0 = new Array(volume).fill(-1);
  for (const b of blocks) {
    const { name, states } = translate(b.name, b.properties);
    layer0[(b.x * sy + b.y) * sz + b.z] = indexOf(name, states);
  }
  const layer1 = new Array(volume).fill(-1);

  const blockPalette = paletteEntries.map((e) => ({
    name: nbtString(e.name),
    states: { type: 'compound', value: encodeStates(e.states) },
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

// Full pipeline: raw .litematic bytes -> { mcstructure, name, size, blockCount }.
async function litematicToMcstructure(buffer) {
  const lite = await readLitematic(buffer);
  return {
    mcstructure: buildMcstructure(lite.blocks, lite.size),
    name: lite.name,
    size: lite.size,
    blockCount: lite.blockCount,
  };
}

module.exports = { litematicToMcstructure, buildMcstructure, translate };
