const NotificationService = require('../services/notification.service');
const logger = require('../utils/logger');

/**
 * Mock promotion data for simulation purposes
 */
const mockPromotions = [
    {
        promotionId: 'PROMO-1001',
        title: 'Weekend Flash Sale',
        message: 'Get 25% off on all electronics',
        discount: '25%',
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        imageUrl: 'https://example.com/promotions/flash-sale.jpg',
        categories: ['electronics']
    },
    {
        promotionId: 'PROMO-1002',
        title: 'Summer Clothing Sale',
        message: 'Up to 40% off on summer collection',
        discount: '40%',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        imageUrl: 'https://example.com/promotions/summer-sale.jpg',
        categories: ['clothing', 'fashion']
    },
    {
        promotionId: 'PROMO-1003',
        title: 'Home Decor Special',
        message: 'Buy one get one free on home decor items',
        discount: 'BOGO',
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        imageUrl: 'https://example.com/promotions/home-decor.jpg',
        categories: ['home', 'decor']
    }
];

/**
 * Mock user data for simulation purposes
 */
const mockUsers = [
    {
        _id: '607f1f77bcf86cd799439011',
        preferences: {
            notifications: {
                promotions: true
            },
            categories: ['electronics', 'home']
        }
    },
    {
        _id: '607f1f77bcf86cd799439012',
        preferences: {
            notifications: {
                promotions: true
            },
            categories: ['clothing', 'fashion']
        }
    },
    {
        _id: '607f1f77bcf86cd799439013',
        preferences: {
            notifications: {
                promotions: false
            },
            categories: ['electronics', 'clothing']
        }
    },
    {
        _id: '607f1f77bcf86cd799439014',
        preferences: {
            notifications: {
                promotions: true
            },
            categories: ['home', 'decor']
        }
    }
];

const processPromotions = async () => {
    try {
        logger.info('Processing promotions...');

        // Select a random promotion for this run
        const randomPromotion = mockPromotions[Math.floor(Math.random() * mockPromotions.length)];

        // Find users who are eligible for this promotion
        // In a real system, we'd query the User Service for this
        const eligibleUsers = mockUsers.filter(user =>
            user.preferences.notifications.promotions &&
            user.preferences.categories.some(category =>
                randomPromotion.categories.includes(category)
            )
        );

        // Create notifications for eligible users
        if (eligibleUsers.length > 0) {
            const userIds = eligibleUsers.map(user => user._id);

            const notifications = await NotificationService.createPromotionNotifications(
                userIds,
                randomPromotion
            );

            logger.info(`Created ${notifications.length} promotion notifications`);
            return notifications;
        } else {
            logger.info('No eligible users found for promotion');
            return [];
        }
    } catch (error) {
        logger.error('Error processing promotions:', error);
        throw error;
    }
};

module.exports = {
    processPromotions
};