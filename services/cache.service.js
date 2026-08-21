// Tiny in-memory TTL cache for hot, rarely-changing read endpoints
// (branches list, blogs list). Avoids a DB round-trip on every request
// while still reflecting writes immediately via invalidate().

const store = new Map();

export const getCache = (key) => {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry.value;
};

export const setCache = (key, value, ttlMs) => {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
};

export const invalidateCache = (keyOrPrefix) => {
  for (const key of store.keys()) {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
      store.delete(key);
    }
  }
};
