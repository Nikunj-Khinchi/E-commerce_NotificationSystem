// services/notification-service/src/jobs/order-update.job.js
const NotificationService = require('../services/notification.service');
const logger = require('../utils/logger');

/**
 * Mock order data for simulation purposes
 */
const mockOrders = [
    {
        orderId: 'ORD-1001',
        userId: '607f1f77bcf86cd799439011',
        status: 'processing',
        message: 'Your order is being processed',
        updatedAt: new Date()
    },
    {
        orderId: 'ORD-1002',
        userId: '607f1f77bcf86cd799439012',
        status: 'shipped',
        message: 'Your order has been shipped',
        updatedAt: new Date()
    },
    {
        orderId: 'ORD-1003',
        userId: '607f1f77bcf86cd799439013',
        status: 'delivered',
        message: 'Your order has been delivered',
        updatedAt: new Date()
    }
];

/**
 * Process order updates and create notifications
 * In a real-world scenario, this would fetch data from an Order Service
 * @returns {Promise<void>}
 */
const processOrderUpdates = async () => {
    try {
        logger.info('Processing order updates...');

        // In a real system, we'd fetch actual order updates
        // Here we'll use mock data that changes status on each run
        const orderUpdates = mockOrders.map(order => {
            // Rotate status for simulation
            let newStatus;
            switch (order.status) {
                case 'processing':
                    newStatus = 'shipped';
                    break;
                case 'shipped':
                    newStatus = 'delivered';
                    break;
                case 'delivered':
                    newStatus = 'processing';
                    break;
                default:
                    newStatus = 'processing';
            }

            // Update message based on status
            let message;
            switch (newStatus) {
                case 'processing':
                    message = 'Your order is being processed';
                    break;
                case 'shipped':
                    message = 'Your order has been shipped';
                    break;
                case 'delivered':
                    message = 'Your order has been delivered';
                    break;
                default:
                    message = 'Order status updated';
            }

            return {
                ...order,
                status: newStatus,
                message,
                updatedAt: new Date()
            };
        });

        // Create notification for each update
        const notifications = [];

        for (const order of orderUpdates) {
            const notification = await NotificationService.createOrderUpdateNotification(
                order.userId,
                order
            );

            notifications.push(notification);
        }

        // Update mock orders for next run
        mockOrders.forEach((order, index) => {
            order.status = orderUpdates[index].status;
            order.message = orderUpdates[index].message;
            order.updatedAt = orderUpdates[index].updatedAt;
        });

        logger.info(`Created ${notifications.length} order update notifications`);

        return notifications;
    } catch (error) {
        logger.error('Error processing order updates:', error);
        throw error;
    }
};

module.exports = {
    processOrderUpdates
};