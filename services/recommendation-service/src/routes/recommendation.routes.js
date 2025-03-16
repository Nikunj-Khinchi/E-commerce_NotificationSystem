// services/recommendation-service/src/routes/recommendation.routes.js
const express = require('express');
const recommendationController = require('../controllers/recommendation.controller');

const router = express.Router();

// Create user activity
router.post('/activities', recommendationController.createUserActivity);

// Get recommendations for a user
router.get('/users/:userId', recommendationController.getUserRecommendations);

// Generate recommendations for a user
router.post('/users/:userId/generate', recommendationController.generateUserRecommendations);

// Generate batch recommendations for all users
router.post('/batch', recommendationController.generateBatchRecommendations);

// Mark a recommendation as sent
router.patch('/:recommendationId/sent', recommendationController.markRecommendationAsSent);

module.exports = router;