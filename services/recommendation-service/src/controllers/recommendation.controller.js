// services/recommendation-service/src/controllers/recommendation.controller.js
const RecommendationService = require('../services/recommendation.service');

/**
 * Create user activity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createUserActivity = async (req, res) => {
    try {
        const { userId, productId, activityType, metadata } = req.body;

        if (!userId || !productId || !activityType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, productId, activityType'
            });
        }

        const activity = await RecommendationService.createUserActivity({
            userId,
            productId,
            activityType,
            metadata
        });

        res.status(201).json({
            success: true,
            data: {
                activity
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
 * Get recommendations for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getUserRecommendations = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const recommendations = await RecommendationService.getUserRecommendations(userId);

        res.status(200).json({
            success: true,
            data: {
                recommendations
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
 * Generate recommendations for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const generateUserRecommendations = async (req, res) => {
    try {
        const { userId } = req.params;
        const { preferences } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const recommendations = await RecommendationService.generateUserRecommendations(userId, preferences);

        res.status(200).json({
            success: true,
            data: {
                recommendations
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
 * Generate batch recommendations for all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const generateBatchRecommendations = async (req, res) => {
    try {
        const results = await RecommendationService.generateBatchRecommendations();

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Mark a recommendation as sent
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const markRecommendationAsSent = async (req, res) => {
    try {
        const { recommendationId } = req.params;

        if (!recommendationId) {
            return res.status(400).json({
                success: false,
                message: 'Recommendation ID is required'
            });
        }

        const recommendation = await RecommendationService.markRecommendationAsSent(recommendationId);

        res.status(200).json({
            success: true,
            data: {
                recommendation
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
    createUserActivity,
    getUserRecommendations,
    generateUserRecommendations,
    generateBatchRecommendations,
    markRecommendationAsSent
};