// services/user-service/src/services/user.service.js
const User = require('../models/user.model');
const rabbitmq = require('../utils/rabbitmq');
const config = require('../config');

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async (userData) => {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('User already exists with this email');
        }

        // Create new user
        const user = new User(userData);
        await user.save();

        // Publish user created event
        await rabbitmq.publish(
            config.rabbitmq.exchanges.user,
            config.rabbitmq.queues.userCreated,
            {
                userId: user._id,
                email: user.email,
                name: user.name,
                preferences: user.preferences,
                timestamp: new Date()
            }
        );

        return user;
    } catch (error) {
        throw error;
    }
};

/**
 * Login a user
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Promise<Object>} User object
 */
const loginUser = async (email, password) => {
    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }

        // Check if password is correct
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        return user;
    } catch (error) {
        throw error;
    }
};

/**
 * Get user by ID
 * @param {String} userId - User ID
 * @returns {Promise<Object>} User object
 */
const getUserById = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        return user;
    } catch (error) {
        throw error;
    }
};

/**
 * Update user preferences
 * @param {String} userId - User ID
 * @param {Object} preferences - User preferences
 * @returns {Promise<Object>} Updated user
 */
const updateUserPreferences = async (userId, preferences) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Update preferences
        user.preferences = {
            ...user.preferences,
            ...preferences
        };

        await user.save();

        // Publish preferences updated event
        await rabbitmq.publish(
            config.rabbitmq.exchanges.user,
            config.rabbitmq.queues.userPreferencesUpdated,
            {
                userId: user._id,
                preferences: user.preferences,
                timestamp: new Date()
            }
        );

        return user;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createUser,
    loginUser,
    getUserById,
    updateUserPreferences
};