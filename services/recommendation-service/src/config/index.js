module.exports = {
    port: process.env.PORT || 3003,
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/recommendation-service'
    },
    rabbitmq: {
        uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
        exchanges: {
            user: 'user.events',
            notification: 'notification.events',
            recommendation: 'recommendation.events'
        },
        queues: {
            userCreated: 'recommendation.user.created',
            userPreferencesUpdated: 'recommendation.user.preferences.updated',
            userActivity: 'recommendation.user.activity'
        }
    },
    recommendations: {
        // Maximum number of recommendations to generate per user
        maxRecommendations: 5,

        // How long recommendations are valid (in days)
        expiryDays: 7,

        // Minimum score threshold for recommendations (0-1)
        minimumScore: 0.3,

        // Weights for different activity types in scoring
        activityWeights: {
            purchase: 1.0,
            cart: 0.8,
            wishlist: 0.7,
            view: 0.5,
            search: 0.3
        },

        // Time decay factor for older activities (0-1)
        timeDecayFactor: 0.9,

        // Scheduler configuration for generating recommendations
        scheduler: {
            // Run every day at 1:00 AM
            cron: '0 1 * * *'
        }
    }
};