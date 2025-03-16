const logger = require('../utils/logger');
const onFinished = require('on-finished');

const requestLogger = (req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);

    onFinished(res, () => {
        logger.info(`Response Status: ${res.statusCode} - ${req.method} ${req.originalUrl}`);
    });

    next();
};

module.exports = requestLogger;
