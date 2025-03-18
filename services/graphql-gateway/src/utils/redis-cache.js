// services/graphql-gateway/src/utils/redis-cache.js
const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger')
// Initialize Redis client
const redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    keyPrefix: 'graphql:',
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

// Handle connection errors
redis.on('error', (error) => {
    logger.error('Redis connection error:', error);
});

// Handle successful connection
redis.on('connect', () => {
    logger.info('Connected to Redis cache');
});

/**
 * Get cached data or fetch from source
 * @param {String} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {Number} ttl - Time to live in seconds (optional)
 * @returns {Promise<any>} - Cached or fresh data
 */
const getOrFetch = async (key, fetchFn, ttl = config.redis.ttl) => {
    try {
        // Check if data is in cache
        const cachedData = await redis.get(key);

        if (cachedData) {
            return JSON.parse(cachedData);
        }

        // If not in cache, fetch data
        const data = await fetchFn();

        // Store in cache if data exists and is not null
        if (data !== null && data !== undefined) {
            await redis.set(key, JSON.stringify(data), 'EX', ttl);
        }

        return data;
    } catch (error) {
        logger.error(`Cache error for key ${key}:`, error);
        // On cache error, fall back to fetching directly
        return fetchFn();
    }
};

/**
 * Invalidate cache entry
 * @param {String} key - Cache key
 * @returns {Promise<Boolean>} Success flag
 */
const invalidate = async (key) => {
    try {
        await redis.del(key);
        return true;
    } catch (error) {
        logger.error(`Error invalidating cache for key ${key}:`, error);
        return false;
    }
};

/**
 * Invalidate cache entries by key pattern
 * @param {String} pattern - Key pattern (prefix)
 * @returns {Promise<Number>} Number of invalidated keys
 */
const invalidatePattern = async (pattern) => {
    try {
        const keys = await redis.keys(`${redis.options.keyPrefix}${pattern}*`);

        if (keys.length === 0) {
            return 0;
        }

        // Remove the prefix from each key for the del command
        const keysWithoutPrefix = keys.map(key =>
            key.replace(redis.options.keyPrefix, '')
        );

        const deleted = await redis.del(keysWithoutPrefix);
        return deleted;
    } catch (error) {
        logger.error(`Error invalidating cache pattern ${pattern}:`, error);
        return 0;
    }
};

/**
 * Clear entire cache
 * @returns {Promise<Boolean>} Success flag
 */
const clearAll = async () => {
    try {
        // Only clear keys with our prefix
        const keys = await redis.keys(`${redis.options.keyPrefix}*`);

        if (keys.length === 0) {
            return true;
        }

        // Remove the prefix from each key for the del command
        const keysWithoutPrefix = keys.map(key =>
            key.replace(redis.options.keyPrefix, '')
        );

        await redis.del(keysWithoutPrefix);
        return true;
    } catch (error) {
        logger.error('Error clearing cache:', error);
        return false;
    }
};

module.exports = {
    redis,
    getOrFetch,
    invalidate,
    invalidatePattern,
    clearAll
};