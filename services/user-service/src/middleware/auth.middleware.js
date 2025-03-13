// services/user-service/src/middleware/auth.middleware.js
const jwtUtils = require('../utils/jwt.utils');

/**
 * Authenticate user middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const authenticate = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Verify token
        const token = authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyToken(token);

        // Set user in request
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

module.exports = {
    authenticate
};