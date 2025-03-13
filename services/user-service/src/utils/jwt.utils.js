// services/user-service/src/utils/jwt.utils.js
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate JWT token for a user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email
        },
        config.jwt.secret,
        {
            expiresIn: config.jwt.expiresIn
        }
    );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.secret);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

module.exports = {
    generateToken,
    verifyToken
};