const Notification = require('../models/notification.model');
const rabbitmq = require('../utils/rabbitmq');
const config = require('../config');


const createNotification = async (notificationData) => {
    try {
        const notification = new Notification(notificationData);
        await notification.save();

        // Publish notification created event
        await rabbitmq.publish(
            config.rabbitmq.exchanges.notification,
            'notification.created',
            {
                notificationId: notification._id,
                userId: notification.userId,
                type: notification.type,
                title: notification.title,
                sentAt: notification.sentAt,
                timestamp: new Date()
            }
        );

        return notification;
    } catch (error) {
        throw error;
    }
};

const getUserNotifications = async (userId, options = {}) => {
    try {
        const { limit = 20, offset = 0, read, type } = options;

        // Build query
        const query = { userId };

        if (read !== undefined) {
            query.read = read;
        }

        if (type) {
            query.type = type;
        }

        // Get notifications
        const notifications = await Notification.find(query)
            .sort({ sentAt: -1 })
            .skip(offset)
            .limit(limit);

        // Get total count
        const total = await Notification.countDocuments(query);

        return {
            notifications,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + notifications.length < total
            }
        };
    } catch (error) {
        throw error;
    }
};

const markNotificationAsRead = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOne({
            _id: notificationId,
            userId
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        notification.read = true;
        notification.readAt = new Date();
        await notification.save();

        return notification;
    } catch (error) {
        throw error;
    }
};

const markAllNotificationsAsRead = async (userId) => {
    try {
        const result = await Notification.updateMany(
            { userId, read: false },
            { read: true, readAt: new Date() }
        );

        return {
            updated: result.modifiedCount
        };
    } catch (error) {
        throw error;
    }
};

const getUnreadCount = async (userId) => {
    try {
        const count = await Notification.countDocuments({
            userId,
            read: false
        });

        return { count };
    } catch (error) {
        throw error;
    }
};

const createPromotionNotifications = async (userIds, promotionData) => {
    try {
        const notifications = [];

        for (const userId of userIds) {
            const notification = await createNotification({
                userId,
                type: 'promotion',
                title: promotionData.title,
                content: {
                    message: promotionData.message,
                    discount: promotionData.discount,
                    expiresAt: promotionData.expiresAt,
                    imageUrl: promotionData.imageUrl
                },
                metadata: {
                    promotionId: promotionData.promotionId
                }
            });

            notifications.push(notification);
        }

        return notifications;
    } catch (error) {
        throw error;
    }
};

const createOrderUpdateNotification = async (userId, orderData) => {
    try {
        const notification = await createNotification({
            userId,
            type: 'order_update',
            title: `Update on your order #${orderData.orderId}`,
            content: {
                orderId: orderData.orderId,
                status: orderData.status,
                message: orderData.message,
                updatedAt: orderData.updatedAt
            },
            metadata: {
                orderId: orderData.orderId
            }
        });

        return notification;
    } catch (error) {
        throw error;
    }
};

const createRecommendationNotification = async (userId, recommendationData) => {
    try {
        const notification = await createNotification({
            userId,
            type: 'recommendation',
            title: 'Products you might like',
            content: {
                products: recommendationData.products,
                message: recommendationData.message
            },
            metadata: {
                recommendationId: recommendationData.recommendationId
            }
        });

        return notification;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadCount,
    createPromotionNotifications,
    createOrderUpdateNotification,
    createRecommendationNotification
};