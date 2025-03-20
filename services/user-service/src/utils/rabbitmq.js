
const amqp = require('amqplib');
const config = require('../config');
const logger = require('./logger');
const client = require('prom-client');
let connection = null;
let channel = null;


// Define Prometheus metrics
const metrics = {
    queueSize: new client.Gauge({
        name: 'rabbitmq_queue_size',
        help: 'Number of messages in queue',
        labelNames: ['queue']
    }),
    publishedMessages: new client.Counter({
        name: 'rabbitmq_messages_published_total',
        help: 'Total number of messages published',
        labelNames: ['exchange', 'routing_key']
    }),
    consumedMessages: new client.Counter({
        name: 'rabbitmq_messages_consumed_total',
        help: 'Total number of messages consumed',
        labelNames: ['queue']
    }),
    connectionStatus: new client.Gauge({
        name: 'rabbitmq_connection_status',
        help: 'Connection status (1 = connected, 0 = disconnected)'
    })
};


const connect = async () => {
    try {
        connection = await amqp.connect(config.rabbitmq.uri);
        channel = await connection.createChannel();

        // Ensure exchanges exist
        await channel.assertExchange(config.rabbitmq.exchanges.user, 'topic', { durable: true });

        // Create queues before starting monitoring
        const queues = Object.values(config.rabbitmq.queues);
        for (const queue of queues) {
            await channel.assertQueue(queue, {
                durable: true,
                autoDelete: false
            });
            logger.info(`Queue ${queue} created/verified`);
        }

        // Set connection status metric
        metrics.connectionStatus.set(1);

        // Start queue monitoring
        startQueueMonitoring();

        logger.info('Connected to RabbitMQ');
        return channel;
    } catch (error) {
        logger.error('RabbitMQ connection error:', error);
        // Retry connection after delay
        setTimeout(connect, 5000);
        throw error;
    }
};

const publish = async (exchange, routingKey, message) => {
    try {
        if (!channel) {
            await connect();
        }

        const result = await channel.publish(
            exchange,
            routingKey,
            Buffer.from(JSON.stringify(message)),
            { persistent: true }
        );

        // Increment published messages counter
        metrics.publishedMessages.inc({
            exchange,
            routing_key: routingKey
        });

        return result;
    } catch (error) {
        logger.error(`Error publishing message to ${exchange}:${routingKey}`, error);
        throw error;
    }
};


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
                // Increment consumed messages counter
                metrics.consumedMessages.inc({ queue });
            }
        });

        logger.info(`Consuming from queue: ${queue}`);
    } catch (error) {
        logger.error(`Error consuming from queue ${queue}`, error);
        throw error;
    }
};


const startQueueMonitoring = () => {
    // Prometheus Integration for Queue Size Monitoring
    setInterval(async () => {
        try {
            // Monitor all configured queues
            const queues = Object.values(config.rabbitmq.queues);
            for (const queue of queues) {
                const queueInfo = await channel.checkQueue(queue);
                metrics.queueSize.set({ queue }, queueInfo.messageCount);
            }
        } catch (error) {
            logger.error('Queue monitoring error:', error);
            metrics.connectionStatus.set(0);
        }
    }, 5000); // Check every 5 seconds
};


const close = async () => {
    try {
        if (channel) {
            await channel.close();
        }
        if (connection) {
            await connection.close();
        }
        metrics.connectionStatus.set(0);
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