// services/notification-service/src/controllers/notification.controller.js
const NotificationService = require('../services/notification.service');

/**
 * Get notifications for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit, offset, read, type } = req.query;

        const options = {
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
            read: read !== undefined ? read === 'true' : undefined,
            type
        };

        const result = await NotificationService.getUserNotifications(userId, options);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Mark a notification as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const markNotificationAsRead = async (req, res) => {
    try {
        const { userId, notificationId } = req.params;

        const notification = await NotificationService.markNotificationAsRead(notificationId, userId);

        res.status(200).json({
            success: true,
            data: {
                notification
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Mark all notifications as read for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await NotificationService.markAllNotificationsAsRead(userId);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get unread notifications count for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await NotificationService.getUnreadCount(userId);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Create a new notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createNotification = async (req, res) => {
    try {
        const { userId, type, title, content, metadata } = req.body;

        const notification = await NotificationService.createNotification({
            userId,
            type,
            title,
            content,
            metadata
        });

        res.status(201).json({
            success: true,
            data: {
                notification
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadCount,
    createNotification
};