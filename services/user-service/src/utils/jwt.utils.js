const jwt = require('jsonwebtoken');
const config = require('../config');


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