// services/graphql-gateway/src/app.js
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

async function startServer() {
    // Initialize express app
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Create executable schema
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // Apply permissions middleware
    const schemaWithMiddleware = applyMiddleware(schema, permissions);

    // Initialize Apollo Server
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
            return {
                message: error.message,
                path: error.path
            };
        }
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
    const httpServer = app.listen(config.port, () => {
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