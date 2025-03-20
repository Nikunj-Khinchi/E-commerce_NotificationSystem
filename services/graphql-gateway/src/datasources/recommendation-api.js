const fetch = require('node-fetch');
const config = require('../config');
const cache = require('../utils/redis-cache');


class RecommendationAPI {
    constructor() {
        this.baseURL = config.services.recommendation.url;
    }


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
        await cache.invalidate(`recommendations:${userId}`);

        return data.data.recommendations;
    }

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
        await cache.invalidate(`recommendations:${activityData.userId}`);

        return data.data.activity;
    }
}

module.exports = RecommendationAPI;