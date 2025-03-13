// services/user-service/src/config/index.js
module.exports = {
    port: process.env.PORT || 3001,
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/user-service-pratilipi'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'nikunj',
        expiresIn: process.env.JWT_EXPIRY || '24h'
    },
    rabbitmq: {
        uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
        exchanges: {
            user: 'user.events',
            notification: 'notification.events',
            recommendation: 'recommendation.events'
        },
        queues: {
            userCreated: 'user.created',
            userUpdated: 'user.updated',
            userPreferencesUpdated: 'user.preferences.updated'
        }
    }
};