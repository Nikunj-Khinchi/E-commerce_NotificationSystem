const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const userRoutes = require('./routes/user.routes');
const rabbitmq = require('./utils/rabbitmq');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger.middleware');

// prometheus monitoring
const client = require('prom-client');
const promMid = require('express-prometheus-middleware');
// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(requestLogger);

// Create a Histogram for tracking request duration
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'users_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5],
});

app.use(promMid({
    metricsPath: '/metrics',
    collectDefaultMetrics: true,
    requestDurationBuckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5],
    normalizeStatus: true,
}));

// Manually track request duration
app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.path, status_code: res.statusCode });
    });
    next();
});

// Routes
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'user-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongodb.uri);
        logger.info('Connected to MongoDB');

        // Connect to RabbitMQ
        await rabbitmq.connect();

        // Start server
        const server = app.listen(config.port, '0.0.0.0', () => {
            logger.info(`User service running on port ${config.port}`);
        });

        // Handle graceful shutdown
        const shutdown = async () => {
            logger.warn('Shutting down user service...');

            server.close(async () => {
                await mongoose.connection.close();
                await rabbitmq.close();
                logger.warn('User service shut down');
                process.exit(0);
            });
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        logger.error('Failed to start user service:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;