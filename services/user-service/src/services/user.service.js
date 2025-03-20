const User = require('../models/user.model');
const rabbitmq = require('../utils/rabbitmq');
const config = require('../config');

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