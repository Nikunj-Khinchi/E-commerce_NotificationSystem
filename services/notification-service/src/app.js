// services/notification-service/src/app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const notificationRoutes = require('./routes/notification.routes');
const rabbitmq = require('./utils/rabbitmq');
const scheduler = require('./jobs/scheduler');
const NotificationService = require('./services/notification.service');
const requestLogger = require('./middlewares/requestLogger.middleware');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(requestLogger)

// Routes
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'notification-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
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
                console.log('Received user created event:', message);

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

                console.log('Created welcome notification for user:', message.userId);
            } catch (error) {
                console.error('Error processing user created event:', error);
            }
        }
    );

    // Handle user preferences updated events
    await rabbitmq.consume(
        config.rabbitmq.queues.userPreferencesUpdated,
        async (message) => {
            try {
                console.log('Received user preferences updated event:', message);

                // Here we could handle changes in notification preferences
                // For example, if a user opts out of promotions, we could cancel scheduled promotions
            } catch (error) {
                console.error('Error processing user preferences updated event:', error);
            }
        }
    );

    // Handle recommendation events
    await rabbitmq.consume(
        config.rabbitmq.queues.recommendations,
        async (message) => {
            try {
                console.log('Received recommendation event:', message);

                // Create recommendation notification
                await NotificationService.createRecommendationNotification(
                    message.userId,
                    {
                        recommendationId: message.recommendationId,
                        products: message.products,
                        message: 'Based on your activity, you might like these products'
                    }
                );

                console.log('Created recommendation notification for user:', message.userId);
            } catch (error) {
                console.error('Error processing recommendation event:', error);
            }
        }
    );
};

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongodb.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Connect to RabbitMQ
        await rabbitmq.connect();

        // Setup message consumers
        await setupConsumers();

        // Initialize scheduler
        scheduler.initScheduler();

        // Start server
        const server = app.listen(config.port, () => {
            console.log(`Notification service running on port ${config.port}`);
        });

        // Handle graceful shutdown
        const shutdown = async () => {
            console.log('Shutting down notification service...');

            server.close(async () => {
                await mongoose.connection.close();
                await rabbitmq.close();
                console.log('Notification service shut down');
                process.exit(0);
            });
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        console.error('Failed to start notification service:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;