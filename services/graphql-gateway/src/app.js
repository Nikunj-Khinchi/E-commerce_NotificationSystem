const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { applyMiddleware } = require('graphql-middleware');
const depthLimit = require('graphql-depth-limit');

const config = require('./config');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { createContext, permissions } = require('./middleware/auth.middleware');
const UserAPI = require('./datasources/user-api');
const NotificationAPI = require('./datasources/notification-api');
const RecommendationAPI = require('./datasources/recommendation-api');
const logger = require('./utils/logger');

const client = require('prom-client');
const promMid = require('express-prometheus-middleware');

async function startServer() {
    // Initialize express app
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Add Prometheus Middleware for API Metrics
    app.use(promMid({
        metricsPath: '/metrics',
        collectDefaultMetrics: true,
        requestDurationBuckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5],
        normalizeStatus: true,
    }));


    // Define GraphQL-Specific Metrics
    const graphqlRequestDuration = new client.Histogram({
        name: 'graphql_request_duration_seconds',
        help: 'Duration of GraphQL requests in seconds',
        labelNames: ['operation', 'status'],
        buckets: [0.1, 0.3, 0.5, 1, 2, 5]
    });

    const graphqlRequestErrors = new client.Counter({
        name: 'graphql_request_errors_total',
        help: 'Total number of GraphQL request errors',
        labelNames: ['operation']
    });

    // Create executable schema
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // Apply permissions middleware
    const schemaWithMiddleware = applyMiddleware(schema, permissions);

    // Initialize Apollo Server with Performance Tracking
    const server = new ApolloServer({
        schema: schemaWithMiddleware,
        context: createContext,
        dataSources: () => ({
            userAPI: new UserAPI(),
            notificationAPI: new NotificationAPI(),
            recommendationAPI: new RecommendationAPI()
        }),
        validationRules: [depthLimit(10)], // Prevent deep queries
        introspection: true,
        playground: true,
        formatError: (error) => {
            logger.error(error);
            graphqlRequestErrors.inc({ operation: error.path?.[0] || 'unknown' }); // Track GraphQL Errors
            return {
                message: error.message,
                path: error.path
            };
        },
        plugins: [{
            requestDidStart: async (requestContext) => {
                const startTime = process.hrtime();
                return {
                    willSendResponse: async () => {
                        const [seconds, nanoseconds] = process.hrtime(startTime);
                        const duration = seconds + nanoseconds / 1e9;
                        graphqlRequestDuration.observe({ operation: requestContext.operationName || 'unknown', status: 'success' }, duration);
                    },
                    didEncounterErrors: async () => {
                        graphqlRequestErrors.inc({ operation: requestContext.operationName || 'unknown' });
                    }
                };
            }
        }]
    });

    // Start Apollo Server
    await server.start();

    // Apply Apollo middleware
    server.applyMiddleware({ app, path: '/graphql' });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', service: 'graphql-gateway' });
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

    // Start server
    const httpServer = app.listen(config.port, '0.0.0.0',  () => {
        logger.info(`GraphQL gateway running at http://localhost:${config.port}${server.graphqlPath}`);
    });

    // Handle graceful shutdown
    const shutdown = () => {
        logger.info('Shutting down GraphQL gateway...');

        httpServer.close(() => {
            logger.info('GraphQL gateway shut down');
            process.exit(0);
        });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    return { server, app, httpServer };
}

// Start the server
startServer().catch(error => {
    logger.error('Failed to start GraphQL gateway:', error);
    process.exit(1);
});

module.exports = { startServer };
