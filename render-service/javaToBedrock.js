'use strict';

// Java -> Bedrock block translation, backed by two vendored data files in
// this directory:
//
//   geyser-blocks.nbt  — GeyserMC's authoritative mapping: one entry per Java
//                        block-state ID, giving the Bedrock identifier and
//                        state tags.
//   java-blocks.json   — Mojang's own block report (server.jar --reports),
//                        which gives every Java block state an explicit id.
//
// Mojang's report maps a block (name + properties) to its state id; Geyser's
// data maps that id to the Bedrock block. Both files must be the same Java
// version — init() verifies their state counts match before activating.
//
// Degrades gracefully: if either file is missing or their versions disagree,
// isReady() stays false and callers fall back to their own translation.

const fs = require('fs');
const path = require('path');

const GEYSER_NBT = path.join(__dirname, 'geyser-blocks.nbt');
const JAVA_REPORT = path.join(__dirname, 'java-blocks.json');

let _ready = false;
let _initPromise = null;
let _mappings = null;     // Geyser bedrock_mappings, NBT-typed, indexed by state id
let _stateIdByKey = null; // "block|sorted,props" -> Java state id

// Canonical lookup key for a block name + its property values. Properties are
// sorted so the litematic side and the report side always agree.
function blockKey(name, props) {
  const short = String(name).replace(/^minecraft:/, '');
  const keys = props ? Object.keys(props).sort() : [];
  if (keys.length === 0) return short;
  return `${short}|${keys.map((k) => `${k}=${props[k]}`).join(',')}`;
}

// Parses both data files once. Idempotent — safe to await on every conversion.
function init() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    if (!fs.existsSync(GEYSER_NBT) || !fs.existsSync(JAVA_REPORT)) {
      console.warn('[javaToBedrock] geyser-blocks.nbt or java-blocks.json missing — built-in fallback in use');
      return;
    }
    let nbt;
    try {
      nbt = require('prismarine-nbt');
    } catch {
      console.warn('[javaToBedrock] prismarine-nbt unavailable — built-in fallback in use');
      return;
    }

    // Geyser side — keep the raw NBT tags (byte vs int vs string matters).
    const { parsed } = await nbt.parse(fs.readFileSync(GEYSER_NBT));
    const entries = parsed.value.bedrock_mappings.value.value;
    _mappings = entries.map((e) => ({
      identifier: e.bedrock_identifier ? e.bedrock_identifier.value : null,
      states: e.state ? e.state.value : {},
    }));

    // Mojang side — every block state with its explicit global id.
    const report = JSON.parse(fs.readFileSync(JAVA_REPORT, 'utf8'));
    const byKey = new Map();
    let maxId = -1;
    for (const [name, block] of Object.entries(report)) {
      for (const st of block.states || []) {
        byKey.set(blockKey(name, st.properties), st.id);
        if (st.id > maxId) maxId = st.id;
      }
    }

    if (maxId + 1 !== _mappings.length) {
      console.warn(
        `[javaToBedrock] version mismatch — java-blocks.json has ${maxId + 1} states, `
        + `Geyser data has ${_mappings.length}; built-in fallback in use`,
      );
      _mappings = null;
      return;
    }
    _stateIdByKey = byKey;
    _ready = true;
    console.log(`[javaToBedrock] ready — Geyser mapping aligned (${_mappings.length} block states)`);
  })().catch((err) => {
    console.error('[javaToBedrock] init failed:', err.message);
  });
  return _initPromise;
}

function isReady() { return _ready; }

// Java (name, properties) -> { name, states } with NBT-typed Bedrock states,
// or null if unavailable / unmapped (the caller then falls back).
function resolve(javaName, props) {
  if (!_ready) return null;
  const id = _stateIdByKey.get(blockKey(javaName, props));
  if (id === undefined) return null;
  const m = _mappings[id];
  if (!m) return null;

  let name;
  if (m.identifier) {
    name = m.identifier.includes(':') ? m.identifier : `minecraft:${m.identifier}`;
  } else {
    name = javaName.includes(':') ? javaName : `minecraft:${javaName}`;
  }
  return { name, states: m.states || {} };
}

module.exports = { init, isReady, resolve };
