// services/graphql-gateway/src/datasources/user-api.js
const fetch = require('node-fetch');
const config = require('../config');
const cache = require('../utils/redis-cache');

class UserAPI {
    constructor() {
        this.baseURL = config.services.user.url;
    }

    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration result
     */
    async registerUser(userData) {
        const response = await fetch(`${this.baseURL}/api/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to register user');
        }

        return data.data;
    }

    /**
     * Login a user
     * @param {Object} credentials - User credentials
     * @returns {Promise<Object>} Login result
     */
    async loginUser(credentials) {
        const response = await fetch(`${this.baseURL}/api/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to login');
        }

        return data.data;
    }

    /**
     * Get user by ID
     * @param {String} userId - User ID
     * @param {String} token - Authentication token
     * @returns {Promise<Object>} User data
     */
    async getUser(userId, token) {
        const cacheKey = `user:${userId}`;

        return cache.getOrFetch(cacheKey, async () => {
            const response = await fetch(`${this.baseURL}/api/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get user');
            }

            return data.data.user;
        });
    }

    /**
     * Update user preferences
     * @param {String} userId - User ID
     * @param {Object} preferences - User preferences
     * @param {String} token - Authentication token
     * @returns {Promise<Object>} Updated user
     */
    async updateUserPreferences(userId, preferences, token) {
        const response = await fetch(`${this.baseURL}/api/users/preferences`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ preferences }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update preferences');
        }

        // Invalidate user cache
        await cache.invalidate(`user:${userId}`);

        return data.data.user;
    }
}

module.exports = UserAPI;