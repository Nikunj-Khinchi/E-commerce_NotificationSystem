// services/graphql-gateway/src/config/index.js
module.exports = {
    port: process.env.PORT || 4000,
    services: {
        user: {
            url: process.env.USER_SERVICE_URL || 'http://localhost:3001'
        },
        notification: {
            url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002'
        },
        recommendation: {
            url: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3003'
        }
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'nikunj'
    },
    cache: {
        ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes in seconds
        checkperiod: 60 // Check for expired keys every 60 seconds
    },
    playground: process.env.NODE_ENV !== 'production'
};