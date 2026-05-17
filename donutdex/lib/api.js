const config = require('../config');

class KeyPool {
  constructor(keys, perMin) {
    this.slots = keys.map((key) => ({ key, hits: [], cooldownUntil: 0 }));
    this.perMin = perMin;
    this.idx = 0;
  }

  next() {
    if (this.slots.length === 0) return null;
    const now = Date.now();
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[(this.idx + i) % this.slots.length];
      slot.hits = slot.hits.filter((t) => now - t < 60_000);
      if (now < slot.cooldownUntil) continue;
      if (slot.hits.length >= this.perMin) continue;
      this.idx = (this.idx + i + 1) % this.slots.length;
      slot.hits.push(now);
      return slot;
    }
    return null;
  }

  cooldown(slot) {
    slot.cooldownUntil = Date.now() + 60_000;
  }
}

const _store = new Map();
const _cache = {
  get(key) {
    const e = _store.get(key);
    if (!e) return undefined;
    if (Date.now() > e.expires) { _store.delete(key); return undefined; }
    return e.value;
  },
  set(key, value, ttl) {
    _store.set(key, { value, expires: Date.now() + ttl });
  },
};

const pool = new KeyPool(config.apiKeys, config.ratePerKeyPerMin);

module.exports = { KeyPool, _cache, pool };
