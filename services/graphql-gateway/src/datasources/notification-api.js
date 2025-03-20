
const fetch = require('node-fetch');
const config = require('../config');
const cache = require('../utils/redis-cache');

class NotificationAPI {
    constructor() {
        this.baseURL = config.services.notification.url;
    }

    async getUserNotifications(userId, options = {}) {
        const { limit, offset, read, type } = options;

        // Build query string
        const queryParams = new URLSearchParams();

        if (limit !== undefined) queryParams.append('limit', limit);
        if (offset !== undefined) queryParams.append('offset', offset);
        if (read !== undefined) queryParams.append('read', read);
        if (type !== undefined) queryParams.append('type', type);

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

        // Don't cache notifications as they change frequently
        const response = await fetch(`${this.baseURL}/api/notifications/users/${userId}${queryString}`);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get notifications');
        }

        return data.data;
    }


    async markNotificationAsRead(userId, notificationId) {
        const response = await fetch(`${this.baseURL}/api/notifications/users/${userId}/${notificationId}/read`, {
            method: 'PATCH',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to mark notification as read');
        }

        // Invalidate unread count cache
        await cache.invalidate(`notifications:unread:${userId}`);

        return data.data.notification;
    }


    async markAllNotificationsAsRead(userId) {
        const response = await fetch(`${this.baseURL}/api/notifications/users/${userId}/read-all`, {
            method: 'PATCH',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to mark all notifications as read');
        }

        // Invalidate unread count cache
        await cache.invalidate(`notifications:unread:${userId}`);

        return data.data;
    }

    async getUnreadCount(userId) {
        const cacheKey = `notifications:unread:${userId}`;

        return cache.getOrFetch(cacheKey, async () => {
            const response = await fetch(`${this.baseURL}/api/notifications/users/${userId}/unread-count`);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get unread count');
            }

            return data.data.count;
        }, 60); // shorter TTL for unread count
    }

    async createNotification(notificationData) {
        const response = await fetch(`${this.baseURL}/api/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create notification');
        }

        // Invalidate unread count cache
        await cache.invalidate(`notifications:unread:${notificationData.userId}`);

        return data.data.notification;
    }
}

module.exports = NotificationAPI;