// services/recommendation-service/src/utils/rabbitmq.js
const amqp = require('amqplib');
const config = require('../config');
const logger = require('./logger');

let connection = null;
let channel = null;


const connect = async () => {
    try {
        connection = await amqp.connect(config.rabbitmq.uri);
        channel = await connection.createChannel();

        // Ensure exchanges exist
        await channel.assertExchange(config.rabbitmq.exchanges.user, 'topic', { durable: true });
        await channel.assertExchange(config.rabbitmq.exchanges.recommendation, 'topic', { durable: true });

        // Setup queues
        await channel.assertQueue(config.rabbitmq.queues.userCreated, { durable: true });
        await channel.assertQueue(config.rabbitmq.queues.userPreferencesUpdated, { durable: true });
        await channel.assertQueue(config.rabbitmq.queues.userActivity, { durable: true });

        // Bind queues to exchanges
        await channel.bindQueue(config.rabbitmq.queues.userCreated, config.rabbitmq.exchanges.user, 'user.created');
        await channel.bindQueue(config.rabbitmq.queues.userPreferencesUpdated, config.rabbitmq.exchanges.user, 'user.preferences.updated');
        await channel.bindQueue(config.rabbitmq.queues.userActivity, config.rabbitmq.exchanges.user, 'user.activity');

        logger.info('Connected to RabbitMQ');
        return channel;
    } catch (error) {
        logger.error('RabbitMQ connection error:', error);
        // Retry connection after delay
        setTimeout(connect, 5000);
        throw error;
    }
};

/**
 * Publish a message to an exchange
 * @param {String} exchange - Exchange name
 * @param {String} routingKey - Routing key
 * @param {Object} message - Message to publish
 * @returns {Promise<boolean>}
 */
const publish = async (exchange, routingKey, message) => {
    try {
        if (!channel) {
            await connect();
        }

        return channel.publish(
            exchange,
            routingKey,
            Buffer.from(JSON.stringify(message)),
            { persistent: true }
        );
    } catch (error) {
        logger.error(`Error publishing message to ${exchange}:${routingKey}`, error);
        throw error;
    }
};

/**
 * Consume messages from a queue
 * @param {String} queue - Queue name
 * @param {Function} callback - Message handler
 * @returns {Promise<void>}
 */
const consume = async (queue, callback) => {
    try {
        if (!channel) {
            await connect();
        }

        await channel.assertQueue(queue, { durable: true });

        channel.consume(queue, (msg) => {
            if (msg) {
                const content = JSON.parse(msg.content.toString());
                callback(content, msg);
                channel.ack(msg);
            }
        });

        logger.info(`Consuming from queue: ${queue}`);
    } catch (error) {
        logger.error(`Error consuming from queue ${queue}`, error);
        throw error;
    }
};

/**
 * Close the RabbitMQ connection
 * @returns {Promise<void>}
 */
const close = async () => {
    try {
        if (channel) {
            await channel.close();
        }
        if (connection) {
            await connection.close();
        }
        logger.info('Closed RabbitMQ connection');
    } catch (error) {
        logger.error('Error closing RabbitMQ connection:', error);
        throw error;
    }
};

// Handle process termination
process.on('SIGINT', async () => {
    await close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await close();
    process.exit(0);
});

module.exports = {
    connect,
    publish,
    consume,
    close
};