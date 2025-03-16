// services/graphql-gateway/src/utils/cache.js
const NodeCache = require('node-cache');
const config = require('../config');

// Initialize cache
const cache = new NodeCache({
    stdTTL: config.cache.ttl,
    checkperiod: config.cache.checkperiod
});

/**
 * Get cached data or fetch from source
 * @param {String} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {Number} ttl - Time to live in seconds (optional)
 * @returns {Promise<any>} - Cached or fresh data
 */
const getOrFetch = async (key, fetchFn, ttl = config.cache.ttl) => {
    // Check if data is in cache
    const cachedData = cache.get(key);

    if (cachedData !== undefined) {
        return cachedData;
    }

    // If not in cache, fetch data
    const data = await fetchFn();

    // Store in cache
    cache.set(key, data, ttl);

    return data;
};

/**
 * Invalidate cache entry
 * @param {String} key - Cache key
 * @returns {Boolean} Success flag
 */
const invalidate = (key) => {
    return cache.del(key);
};

/**
 * Invalidate cache entries by key pattern
 * @param {String} pattern - Key pattern (prefix)
 * @returns {Number} Number of invalidated keys
 */
const invalidatePattern = (pattern) => {
    const keys = cache.keys();
    let count = 0;

    keys.forEach(key => {
        if (key.startsWith(pattern)) {
            cache.del(key);
            count++;
        }
    });

    return count;
};

/**
 * Clear entire cache
 * @returns {Boolean} Success flag
 */
const clearAll = () => {
    return cache.flushAll();
};

module.exports = {
    getOrFetch,
    invalidate,
    invalidatePattern,
    clearAll
};