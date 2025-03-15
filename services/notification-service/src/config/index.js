// services/notification-service/src/config/index.js
module.exports = {
    port: process.env.PORT || 3002,
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/notification-service'
    },
    rabbitmq: {
        uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
        exchanges: {
            user: 'user.events',
            notification: 'notification.events',
            recommendation: 'recommendation.events'
        },
        queues: {
            userCreated: 'notification.user.created',
            userPreferencesUpdated: 'notification.user.preferences.updated',
            promotions: 'notification.promotions',
            orderUpdates: 'notification.order.updates',
            recommendations: 'notification.recommendations'
        }
    },
    scheduler: {
        promotions: {
            cron: '0 12 * * *'  // Daily at noon
        },
        orderUpdates: {
            cron: '*/30 * * * *'  // Every 30 minutes
        }
    }
};