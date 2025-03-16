// services/graphql-gateway/src/utils/jwt.utils.js
const jwt = require('jsonwebtoken');
const config = require('../config');

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
    verifyToken
};