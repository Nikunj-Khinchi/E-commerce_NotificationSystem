// services/graphql-gateway/src/datasources/recommendation-api.js
const fetch = require('node-fetch');
const config = require('../config');
const cache = require('../utils/cache');

class RecommendationAPI {
    constructor() {
        this.baseURL = config.services.recommendation.url;
    }

    /**
     * Get recommendations for a user
     * @param {String} userId - User ID
     * @returns {Promise<Object>} User recommendations
     */
    async getUserRecommendations(userId) {
        const cacheKey = `recommendations:${userId}`;

        return cache.getOrFetch(cacheKey, async () => {
            const response = await fetch(`${this.baseURL}/api/recommendations/users/${userId}`);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get recommendations');
            }

            return data.data.recommendations;
        }, 3600); // Cache for 1 hour
    }

    /**
     * Generate recommendations for a user
     * @param {String} userId - User ID
     * @param {Object} preferences - User preferences
     * @returns {Promise<Object>} Generated recommendations
     */
    async generateUserRecommendations(userId, preferences) {
        const response = await fetch(`${this.baseURL}/api/recommendations/users/${userId}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ preferences }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to generate recommendations');
        }

        // Invalidate recommendations cache
        cache.invalidate(`recommendations:${userId}`);

        return data.data.recommendations;
    }

    /**
     * Create user activity
     * @param {Object} activityData - User activity data
     * @returns {Promise<Object>} Created activity
     */
    async createUserActivity(activityData) {
        const response = await fetch(`${this.baseURL}/api/recommendations/activities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activityData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create activity');
        }

        // Invalidate recommendations cache as new activity might change them
        cache.invalidate(`recommendations:${activityData.userId}`);

        return data.data.activity;
    }
}

module.exports = RecommendationAPI;