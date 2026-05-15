'use strict';

const nbt = require('prismarine-nbt');
const zlib = require('zlib');
const { promisify } = require('util');
const gunzip = promisify(zlib.gunzip);

const AIR = new Set(['minecraft:air', 'minecraft:cave_air', 'minecraft:void_air']);

// Cap on decompressed NBT to defend against zip-bomb-style attachments.
// Litematic files are gzipped NBT; even very large builds decompress to
// well under 50 MB so this bound rejects pathological inputs while
// preserving headroom for legitimate large schematics.
const MAX_DECOMPRESSED_BYTES = 50 * 1024 * 1024;

function gunzipBounded(buffer, maxBytes) {
  return new Promise((resolve, reject) => {
    const gunzipStream = zlib.createGunzip();
    const chunks = [];
    let total = 0;
    gunzipStream.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        gunzipStream.destroy();
        reject(new Error(`decompressed payload exceeds ${maxBytes} bytes`));
        return;
      }
      chunks.push(chunk);
    });
    gunzipStream.on('end', () => resolve(Buffer.concat(chunks, total)));
    gunzipStream.on('error', reject);
    gunzipStream.end(buffer);
  });
}

async function parseNbt(buffer) {
  // Detect gzip header (0x1f 0x8b) and bounded-decompress; otherwise parse raw NBT.
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
    const raw = await gunzipBounded(buffer, MAX_DECOMPRESSED_BYTES);
    const parsed = await nbt.parse(raw);
    return nbt.simplify(parsed.parsed);
  }
  if (buffer.length > MAX_DECOMPRESSED_BYTES) {
    throw new Error(`uncompressed input exceeds ${MAX_DECOMPRESSED_BYTES} bytes`);
  }
  const parsed = await nbt.parse(buffer);
  return nbt.simplify(parsed.parsed);
}

function toBigInt(v) {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number') return BigInt(v);
  if (typeof v === 'string') return BigInt(v);
  if (Array.isArray(v) && v.length === 2) {
    const h = BigInt.asUintN(32, BigInt(v[0]));
    const l = BigInt.asUintN(32, BigInt(v[1]));
    return BigInt.asUintN(64, (h << 32n) | l);
  }
  return 0n;
}

async function readLitematic(buffer, opts = {}) {
  const maxBlocks = opts.maxBlocks ?? 2_000_000;
  // Fail-closed cap on the total declared region volume. A region with huge
  // mostly-air volume can drag the loop through hundreds of millions of
  // iterations even though it produces few non-air blocks. Cap volume before
  // iterating.
  const maxVolume = opts.maxVolume ?? 8_000_000;
  const data = await parseNbt(buffer);

  const meta = data.Metadata || {};
  const regions = data.Regions || {};

  const result = {
    name: meta.Name || 'unnamed',
    author: meta.Author || '',
    description: meta.Description || '',
    blocks: [],
    entities: [],
    size: { x: 0, y: 0, z: 0 },
  };

  // Entity caps mirror block caps — schematics rarely have many entities but
  // a hostile payload could otherwise spawn enormous lists.
  const maxEntities = opts.maxEntities ?? 5_000;

  let total = 0;
  // Pre-flight: sum all region volumes and reject if total too large.
  let totalDeclaredVolume = 0;
  for (const region of Object.values(regions)) {
    const s = region.Size || { x: 0, y: 0, z: 0 };
    totalDeclaredVolume += Math.abs(s.x) * Math.abs(s.y) * Math.abs(s.z);
  }
  if (totalDeclaredVolume > maxVolume) {
    throw new Error(`region volume too large (${totalDeclaredVolume} > ${maxVolume})`);
  }

  for (const region of Object.values(regions)) {
    const pos = region.Position || { x: 0, y: 0, z: 0 };
    const size = region.Size || { x: 0, y: 0, z: 0 };
    const palette = region.BlockStatePalette || [];
    const statesRaw = region.BlockStates || [];

    // Entities: Litematica stores `Pos` RELATIVE to the region's anchor
    // (region.Position), not in absolute world coords. Convert to the same
    // world coord frame as blocks here so the final re-base shift applies
    // uniformly to both. (Verified empirically: kelp schematic with pos=(55,21,30)
    // and entity Pos=(-44.96875,-9.5,-26.5) places the entity at world
    // (10.03, 11.5, 3.5) — inside the block grid 0..55.)
    const rawEntities = Array.isArray(region.Entities) ? region.Entities : [];
    for (const ent of rawEntities) {
      if (!ent || !ent.id) continue;
      const epos = Array.isArray(ent.Pos) ? ent.Pos : null;
      if (!epos || epos.length < 3) continue;
      const rot = Array.isArray(ent.Rotation) ? ent.Rotation : [0, 0];
      result.entities.push({
        id: ent.id,
        x: Number(epos[0]) + (pos.x || 0),
        y: Number(epos[1]) + (pos.y || 0),
        z: Number(epos[2]) + (pos.z || 0),
        yaw: Number(rot[0]) || 0,
        pitch: Number(rot[1]) || 0,
        // Pass through fields entity renderers care about.
        facing: typeof ent.Facing === 'number' ? ent.Facing : undefined,
        variant: ent.variant || ent.Motive,
        tileX: ent.TileX, tileY: ent.TileY, tileZ: ent.TileZ,
        item: ent.Item,
        invisible: !!ent.Invisible,
        small: !!ent.Small,
        showArms: !!ent.ShowArms,
      });
      if (result.entities.length >= maxEntities) break;
    }

    const sx = Math.abs(size.x);
    const sy = Math.abs(size.y);
    const sz = Math.abs(size.z);
    if (sx === 0 || sy === 0 || sz === 0) continue;

    const ox = size.x < 0 ? pos.x + size.x + 1 : pos.x;
    const oy = size.y < 0 ? pos.y + size.y + 1 : pos.y;
    const oz = size.z < 0 ? pos.z + size.z + 1 : pos.z;

    const volume = sx * sy * sz;
    if (palette.length === 0) continue;
    // Validate BlockStates packed-long array sized correctly vs dimensions.
    // Mismatch indicates a malformed or hostile schematic; fail closed.
    if (palette.length > 1) {
      const bits = Math.max(2, Math.ceil(Math.log2(palette.length)));
      const expectedLongs = Math.ceil((volume * bits) / 64);
      if (statesRaw.length < expectedLongs) {
        throw new Error(`malformed schematic: BlockStates length ${statesRaw.length} < expected ${expectedLongs}`);
      }
    }
    // Single-palette region: every block is palette[0]. Fill the volume if it's not air.
    if (palette.length === 1) {
      const only = palette[0];
      if (!only?.Name || AIR.has(only.Name)) continue;
      for (let i = 0; i < volume; i++) {
        const localX = i % sx;
        const localZ = Math.floor(i / sx) % sz;
        const localY = Math.floor(i / (sx * sz));
        result.blocks.push({
          x: ox + localX, y: oy + localY, z: oz + localZ,
          name: only.Name, properties: only.Properties || {},
        });
        if (++total > maxBlocks) {
          throw new Error(`schematic too large (>${maxBlocks} non-air blocks)`);
        }
      }
      continue;
    }

    const bits = Math.max(2, Math.ceil(Math.log2(palette.length)));
    const mask = (1n << BigInt(bits)) - 1n;
    const longs = statesRaw.map(toBigInt);

    for (let i = 0; i < volume; i++) {
      const startBit = i * bits;
      const startLong = Math.floor(startBit / 64);
      const startOffsetN = startBit % 64;
      const startOffset = BigInt(startOffsetN);

      let value = (longs[startLong] >> startOffset) & mask;
      const endOffset = startOffsetN + bits;
      if (endOffset > 64 && startLong + 1 < longs.length) {
        const bitsFromNext = endOffset - 64;
        const fromNext = longs[startLong + 1] & ((1n << BigInt(bitsFromNext)) - 1n);
        value |= fromNext << BigInt(bits - bitsFromNext);
      }

      const idx = Number(value);
      const entry = palette[idx];
      if (!entry || !entry.Name || AIR.has(entry.Name)) continue;

      const localX = i % sx;
      const localZ = Math.floor(i / sx) % sz;
      const localY = Math.floor(i / (sx * sz));

      result.blocks.push({
        x: ox + localX,
        y: oy + localY,
        z: oz + localZ,
        name: entry.Name,
        properties: entry.Properties || {},
      });

      if (++total > maxBlocks) {
        throw new Error(`schematic too large (>${maxBlocks} non-air blocks)`);
      }
    }
  }

  if (result.blocks.length === 0) {
    throw new Error('schematic contains no blocks');
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const b of result.blocks) {
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.z < minZ) minZ = b.z;
    if (b.x > maxX) maxX = b.x;
    if (b.y > maxY) maxY = b.y;
    if (b.z > maxZ) maxZ = b.z;
  }
  for (const b of result.blocks) {
    b.x -= minX; b.y -= minY; b.z -= minZ;
  }
  // Re-base entities into the same origin. Entity Pos is in world doubles —
  // subtract the block-origin shift so an entity at world (12.5, 5, 8.5)
  // renders at the same cell as block (12, 5, 8) in the re-based grid.
  for (const e of result.entities) {
    e.x -= minX; e.y -= minY; e.z -= minZ;
  }
  result.size = { x: maxX - minX + 1, y: maxY - minY + 1, z: maxZ - minZ + 1 };
  result.blockCount = result.blocks.length;
  result.entityCount = result.entities.length;
  return result;
}

module.exports = { readLitematic };
