// services/recommendation-service/src/models/user-activity.model.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const userActivitySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    activityType: {
        type: String,
        required: true,
        enum: ['view', 'cart', 'purchase', 'wishlist', 'search'],
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Create compound indexes for faster queries
userActivitySchema.index({ userId: 1, activityType: 1, timestamp: -1 });
userActivitySchema.index({ userId: 1, productId: 1, activityType: 1 });

// Add mock data initialization
userActivitySchema.statics.initMockData = async function (products) {
    const count = await this.countDocuments();

    if (count === 0 && products && products.length > 0) {
        const mockUserIds = [
            '607f1f77bcf86cd799439011',
            '607f1f77bcf86cd799439012',
            '607f1f77bcf86cd799439013',
            '607f1f77bcf86cd799439014'
        ];

        const activityTypes = ['view', 'cart', 'purchase', 'wishlist', 'search'];
        const mockActivities = [];

        // Generate random user activities
        for (const userId of mockUserIds) {
            // Each user has viewed several products
            for (let i = 0; i < 5; i++) {
                const randomProduct = products[Math.floor(Math.random() * products.length)];
                mockActivities.push({
                    userId,
                    productId: randomProduct._id,
                    activityType: 'view',
                    timestamp: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random time in last 30 days
                    metadata: {
                        viewDuration: Math.floor(Math.random() * 300) + 10 // 10-310 seconds
                    }
                });
            }

            // Each user has added products to cart
            for (let i = 0; i < 2; i++) {
                const randomProduct = products[Math.floor(Math.random() * products.length)];
                mockActivities.push({
                    userId,
                    productId: randomProduct._id,
                    activityType: 'cart',
                    timestamp: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000), // Random time in last 15 days
                    metadata: {
                        quantity: Math.floor(Math.random() * 3) + 1 // 1-3 items
                    }
                });
            }

            // Each user has purchased products
            for (let i = 0; i < 1; i++) {
                const randomProduct = products[Math.floor(Math.random() * products.length)];
                mockActivities.push({
                    userId,
                    productId: randomProduct._id,
                    activityType: 'purchase',
                    timestamp: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000), // Random time in last 60 days
                    metadata: {
                        orderId: `ORD-${Math.floor(Math.random() * 10000) + 1000}`,
                        quantity: Math.floor(Math.random() * 2) + 1, // 1-2 items
                        price: randomProduct.price
                    }
                });
            }

            // Some users have added products to wishlist
            if (Math.random() > 0.5) {
                const randomProduct = products[Math.floor(Math.random() * products.length)];
                mockActivities.push({
                    userId,
                    productId: randomProduct._id,
                    activityType: 'wishlist',
                    timestamp: new Date(Date.now() - Math.floor(Math.random() * 45) * 24 * 60 * 60 * 1000) // Random time in last 45 days
                });
            }

            // Some users have searched for products
            if (Math.random() > 0.3) {
                const randomProduct = products[Math.floor(Math.random() * products.length)];
                mockActivities.push({
                    userId,
                    productId: randomProduct._id,
                    activityType: 'search',
                    timestamp: new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000), // Random time in last 20 days
                    metadata: {
                        searchQuery: randomProduct.category
                    }
                });
            }
        }

        await this.insertMany(mockActivities);
        logger.info('Added mock user activities data');
    }
};

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

module.exports = UserActivity;