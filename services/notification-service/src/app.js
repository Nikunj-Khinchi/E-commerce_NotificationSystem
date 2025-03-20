const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const notificationRoutes = require('./routes/notification.routes');
const rabbitmq = require('./utils/rabbitmq');
const scheduler = require('./jobs/scheduler');
const NotificationService = require('./services/notification.service');
const requestLogger = require('./middlewares/requestLogger.middleware');
const logger = require('./utils/logger');

const client = require('prom-client');
const promMid = require('express-prometheus-middleware');
// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(requestLogger)

// Create a Histogram for tracking request duration
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'notifications_http_request_duration_seconds',
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
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'notification-service' });
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

// Set up RabbitMQ consumers
const setupConsumers = async () => {
    // Handle user created events
    await rabbitmq.consume(
        config.rabbitmq.queues.userCreated,
        async (message) => {
            try {
                logger.info('Received user created event:', message);

                // Create welcome notification
                await NotificationService.createNotification({
                    userId: message.userId,
                    type: 'promotion',
                    title: 'Welcome to our platform!',
                    content: {
                        message: `Welcome, ${message.name}! Thank you for joining our platform.`,
                        imageUrl: 'https://example.com/welcome.jpg'
                    }
                });

                logger.info(`Created welcome notification for user: ${message.userId}`);
            } catch (error) {
                logger.error('Error processing user created event:', error);
            }
        }
    );

    // Handle user preferences updated events
    await rabbitmq.consume(
        config.rabbitmq.queues.userPreferencesUpdated,
        async (message) => {
            try {
                logger.info('Received user preferences updated event:', message);

                // Here we could handle changes in notification preferences
                // For example, if a user opts out of promotions, we could cancel scheduled promotions
            } catch (error) {
                logger.error('Error processing user preferences updated event:', error);
            }
        }
    );

    // Handle recommendation events
    await rabbitmq.consume(
        config.rabbitmq.queues.recommendations,
        async (message) => {
            try {
                logger.info('Received recommendation event:', message);

                // Create recommendation notification
                await NotificationService.createRecommendationNotification(
                    message.userId,
                    {
                        recommendationId: message.recommendationId,
                        products: message.products,
                        message: 'Based on your activity, you might like these products'
                    }
                );

                logger.info(`Created recommendation notification for user:  ${message.userId}`);
            } catch (error) {
                logger.error('Error processing recommendation event:', error);
            }
        }
    );
};

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongodb.uri);
        logger.info('Connected to MongoDB');

        // Connect to RabbitMQ
        await rabbitmq.connect();

        // Setup message consumers
        await setupConsumers();

        // Initialize scheduler
        scheduler.initScheduler();

        // Start server
        const server = app.listen(config.port, '0.0.0.0', () => {
            logger.info(`Notification service running on port ${config.port}`);
        });

        // Handle graceful shutdown
        const shutdown = async () => {
            logger.info('Shutting down notification service...');

            server.close(async () => {
                await mongoose.connection.close();
                await rabbitmq.close();
                logger.info('Notification service shut down');
                process.exit(0);
            });
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        logger.error('Failed to start notification service:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;