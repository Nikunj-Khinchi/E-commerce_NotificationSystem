const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const config = require('./config');
const recommendationRoutes = require('./routes/recommendation.routes');
const rabbitmq = require('./utils/rabbitmq');
const RecommendationService = require('./services/recommendation.service');
const Product = require('./models/product.model');
const UserActivity = require('./models/userActivity.model');
const requestLogger = require('./middlewares/requestLogger.middleware');
const logger = require('./utils/logger');

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
    name: 'recommendations_http_request_duration_seconds',
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
app.use('/api/recommendations', recommendationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'recommendation-service' });
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

                // We might use this to initialize user data
                // or trigger initial recommendations
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

                // When user preferences change, generate new recommendations
                if (message.userId && message.preferences) {
                    try {
                        await RecommendationService.generateUserRecommendations(
                            message.userId,
                            message.preferences
                        );
                        logger.info('Generated new recommendations based on updated preferences for user:', message.userId);
                    } catch (error) {
                        logger.error('Failed to generate recommendations after preference update:', error);
                    }
                }
            } catch (error) {
                logger.error('Error processing user preferences updated event:', error);
            }
        }
    );

    // Handle user activity events (in a real system this would be a separate queue)
    await rabbitmq.consume(
        config.rabbitmq.queues.userActivity,
        async (message) => {
            try {
                logger.info('Received user activity event:', message);

                // Create user activity record
                if (message.userId && message.productId && message.activityType) {
                    try {
                        await RecommendationService.createUserActivity({
                            userId: message.userId,
                            productId: message.productId,
                            activityType: message.activityType,
                            metadata: message.metadata || {}
                        });

                        logger.info('Recorded user activity for user:', message.userId);
                    } catch (error) {
                        logger.error('Failed to record user activity:', error);
                    }
                }
            } catch (error) {
                logger.error('Error processing user activity event:', error);
            }
        }
    );
};

// Schedule batch recommendation generation
const scheduleRecommendationJobs = () => {
    cron.schedule(config.recommendations.scheduler.cron, async () => {
        try {
            logger.info('Running scheduled batch recommendation generation');
            await RecommendationService.generateBatchRecommendations();
        } catch (error) {
            logger.error('Error in scheduled batch recommendation generation:', error);
        }
    });

    logger.info('Scheduled recommendation generation job');
};

// Initialize mock data
const initMockData = async () => {
    try {
        // Initialize product data
        await Product.initMockData();

        // Get products for user activity
        const products = await Product.find();

        // Initialize user activity data
        await UserActivity.initMockData(products);

        logger.info('Mock data initialization complete');
    } catch (error) {
        logger.error('Error initializing mock data:', error);
    }
};

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongodb.uri);
        logger.info('Connected to MongoDB');

        // Initialize mock data
        await initMockData();

        // Connect to RabbitMQ
        await rabbitmq.connect();

        // Setup message consumers
        await setupConsumers();

        // Schedule recommendation jobs
        scheduleRecommendationJobs();

        // Start server
        const server = app.listen(config.port, '0.0.0.0', () => {
            logger.info(`Recommendation service running on port ${config.port}`);
        });

        // Handle graceful shutdown
        const shutdown = async () => {
            logger.info('Shutting down recommendation service...');

            server.close(async () => {
                await mongoose.connection.close();
                await rabbitmq.close();
                logger.info('Recommendation service shut down');
                process.exit(0);
            });
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        logger.error('Failed to start recommendation service:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;