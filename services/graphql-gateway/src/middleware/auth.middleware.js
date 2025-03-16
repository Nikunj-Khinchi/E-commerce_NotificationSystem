// services/graphql-gateway/src/middleware/auth.middleware.js
const { AuthenticationError } = require('apollo-server-express');
const { shield, rule, allow, deny } = require('graphql-shield');
const jwtUtils = require('../utils/jwt.utils');
const logger = require('../utils/logger');

// Rule to check if user is authenticated
const isAuthenticated = rule()(async (parent, args, context) => {
    if (!context.user) {
        return new AuthenticationError('You must be logged in to perform this action');
    }
    return true;
});

// Create permission shield
const permissions = shield(
    {
        Query: {
            // Public queries
            health: allow,

            // Protected queries
            getUser: isAuthenticated,
            getUserNotifications: isAuthenticated,
            getUnreadNotificationsCount: isAuthenticated,
            getUserRecommendations: isAuthenticated
        },
        Mutation: {
            // Public mutations
            registerUser: allow,
            loginUser: allow,

            // Protected mutations
            updateUserPreferences: isAuthenticated,
            markNotificationAsRead: isAuthenticated,
            markAllNotificationsAsRead: isAuthenticated,
            createUserActivity: isAuthenticated
        }
    },
    {
        // fallbackRule: isAuthenticated,
        allowExternalErrors: true,
        debug: true,
    }
);

// Context middleware to extract user from request
const createContext = async ({ req }) => {
    // Get auth header
    const authHeader = req.headers.authorization || '';

    if (authHeader.startsWith('Bearer ')) {
        try {
            // Verify token
            const token = authHeader.replace('Bearer ', '');
            const user = jwtUtils.verifyToken(token);

            // Return user in context
            return { user: { ...user, token } };
        } catch (error) {
            logger.error("Invalid token", error)
            // Invalid token
        }
    }

    // No authentication
    return { user: null };
};

module.exports = {
    permissions,
    createContext
};