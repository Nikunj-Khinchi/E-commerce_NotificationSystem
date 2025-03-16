// services/graphql-gateway/src/datasources/notification-api.js
const fetch = require('node-fetch');
const config = require('../config');
const cache = require('../utils/cache');

class NotificationAPI {
    constructor() {
        this.baseURL = config.services.notification.url;
    }

    /**
     * Get notifications for a user
     * @param {String} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Notifications with pagination
     */
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

    /**
     * Mark a notification as read
     * @param {String} userId - User ID
     * @param {String} notificationId - Notification ID
     * @returns {Promise<Object>} Updated notification
     */
    async markNotificationAsRead(userId, notificationId) {
        const response = await fetch(`${this.baseURL}/api/notifications/users/${userId}/${notificationId}/read`, {
            method: 'PATCH',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to mark notification as read');
        }

        // Invalidate unread count cache
        cache.invalidate(`notifications:unread:${userId}`);

        return data.data.notification;
    }

    /**
     * Mark all notifications as read for a user
     * @param {String} userId - User ID
     * @returns {Promise<Object>} Update result
     */
    async markAllNotificationsAsRead(userId) {
        const response = await fetch(`${this.baseURL}/api/notifications/users/${userId}/read-all`, {
            method: 'PATCH',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to mark all notifications as read');
        }

        // Invalidate unread count cache
        cache.invalidate(`notifications:unread:${userId}`);

        return data.data;
    }

    /**
     * Get unread notifications count for a user
     * @param {String} userId - User ID
     * @returns {Promise<Number>} Unread count
     */
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

    /**
     * Create a notification
     * @param {Object} notificationData - Notification data
     * @returns {Promise<Object>} Created notification
     */
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
        cache.invalidate(`notifications:unread:${notificationData.userId}`);

        return data.data.notification;
    }
}

module.exports = NotificationAPI;