const Recommendation = require('../models/recommendation.model');
const Product = require('../models/product.model');
const UserActivity = require('../models/userActivity.model');
const RecommendationAlgorithm = require('../algorithms/recommendation.algorithm');
const rabbitmq = require('../utils/rabbitmq');
const config = require('../config');
const logger = require('../utils/logger');


const createUserActivity = async (activityData) => {
    try {
        // Validate product ID
        if (activityData.productId) {
            const product = await Product.findById(activityData.productId);
            if (!product) {
                throw new Error('Product not found');
            }
        }

        // Create activity
        const activity = new UserActivity(activityData);
        await activity.save();

        return activity;
    } catch (error) {
        throw error;
    }
};


const generateUserRecommendations = async (userId, userPreferences = {}) => {
    try {
        // Check if user already has recent recommendations
        const existingRecommendations = await Recommendation.findOne({
            userId,
            expiresAt: { $gt: new Date() },
            sent: false
        }).sort({ createdAt: -1 });

        if (existingRecommendations) {
            return existingRecommendations;
        }

        // Generate new recommendations
        const recommendedProducts = await RecommendationAlgorithm.generateRecommendations(userId, userPreferences);

        if (recommendedProducts.length === 0) {
            throw new Error('No recommendations available for this user');
        }

        // Create recommendation document
        const recommendation = new Recommendation({
            userId,
            products: recommendedProducts,
            expiresAt: new Date(Date.now() + config.recommendations.expiryDays * 24 * 60 * 60 * 1000)
        });

        await recommendation.save();

        // Publish recommendation created event
        await publishRecommendationCreated(recommendation);

        return recommendation;
    } catch (error) {
        throw error;
    }
};


const getUserRecommendations = async (userId) => {
    try {
        // Find latest recommendations or generate new ones
        let recommendations = await Recommendation.findOne({
            userId,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (!recommendations) {
            // Generate new recommendations
            recommendations = await generateUserRecommendations(userId);
        }

        // Populate product details
        const populatedProducts = await Promise.all(
            recommendations.products.map(async (item) => {
                const product = await Product.findById(item.productId);

                return {
                    product: product ? {
                        _id: product._id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        imageUrl: product.imageUrl,
                        category: product.category,
                        rating: product.rating
                    } : null,
                    score: item.score,
                    reason: item.reason
                };
            })
        );

        // Filter out null products (in case any products were deleted)
        const validProducts = populatedProducts.filter(item => item.product !== null);

        // Mark as sent if not already
        if (!recommendations.sent) {
            recommendations.sent = true;
            recommendations.sentAt = new Date();
            await recommendations.save();
        }

        return {
            _id: recommendations._id,
            userId: recommendations.userId,
            products: validProducts,
            createdAt: recommendations.createdAt,
            expiresAt: recommendations.expiresAt
        };
    } catch (error) {
        throw error;
    }
};


const generateBatchRecommendations = async () => {
    try {
        // Get unique user IDs from activity data
        const users = await UserActivity.distinct('userId');

        const results = {
            success: 0,
            failed: 0,
            total: users.length
        };

        // Generate recommendations for each user
        for (const userId of users) {
            try {
                await generateUserRecommendations(userId);
                results.success++;
            } catch (error) {
                logger.error(`Failed to generate recommendations for user ${userId}:`, error);
                results.failed++;
            }
        }

        logger.info(`Batch recommendation generation complete: ${results.success} succeeded, ${results.failed} failed out of ${results.total}`);

        return results;
    } catch (error) {
        logger.error('Error in batch recommendation generation:', error);
        throw error;
    }
};


const markRecommendationAsSent = async (recommendationId) => {
    try {
        const recommendation = await Recommendation.findById(recommendationId);

        if (!recommendation) {
            throw new Error('Recommendation not found');
        }

        recommendation.sent = true;
        recommendation.sentAt = new Date();
        await recommendation.save();

        return recommendation;
    } catch (error) {
        throw error;
    }
};


const publishRecommendationCreated = async (recommendation) => {
    try {
        const products = await Promise.all(
            recommendation.products.slice(0, 3).map(async (item) => {
                const product = await Product.findById(item.productId);
                return product ? {
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    category: product.category
                } : null;
            })
        );

        // Filter out null products
        const validProducts = products.filter(product => product !== null);

        if (validProducts.length === 0) {
            return false;
        }

        await rabbitmq.publish(
            config.rabbitmq.exchanges.recommendation,
            'recommendation.created',
            {
                recommendationId: recommendation._id,
                userId: recommendation.userId,
                products: validProducts,
                timestamp: new Date()
            }
        );

        return true;
    } catch (error) {
        logger.error('Error publishing recommendation created event:', error);
        return false;
    }
};

module.exports = {
    createUserActivity,
    generateUserRecommendations,
    getUserRecommendations,
    generateBatchRecommendations,
    markRecommendationAsSent
};