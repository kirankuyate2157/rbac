const cache = new Map();

export const setCache = (key, value, ttlMs = 60000) => {
    cache.set(key, { value, expires: Date.now() + ttlMs });
};

export const getCache = (key) => {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
        cache.delete(key);
        return null;
    }
    return entry.value;
};

export const clearCache = (key) => cache.delete(key);
