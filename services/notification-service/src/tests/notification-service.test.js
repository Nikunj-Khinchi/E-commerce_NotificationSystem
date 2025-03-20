// tests/notification-service.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Notification = require('../models/notification.model');

// Mock RabbitMQ to avoid actual connections during tests
jest.mock('../utils/rabbitmq', () => ({
    connect: jest.fn().mockResolvedValue(),
    publish: jest.fn().mockResolvedValue(true),
    consume: jest.fn().mockResolvedValue(),
    close: jest.fn().mockResolvedValue()
}));

// Mock schedulers
jest.mock('../jobs/scheduler', () => ({
    initScheduler: jest.fn()
}));

describe('Notification Service API', () => {
    let mongoServer;

    // Start MongoDB Memory Server before running tests
    beforeAll(async () => {
        // Close any existing connections
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        // Create new server instance
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Connect with specific options
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });



    beforeEach(async () => {
        // Clear all collections before each test
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany();
        }
    });

    afterAll(async () => {
        // Proper cleanup
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    // Helper function to create a notification for testing
    const createTestNotification = async (userId, type = 'promotion', read = false) => {
        const notification = new Notification({
            userId,
            type,
            title: 'Test Notification',
            content: {
                message: 'This is a test notification',
                imageUrl: 'https://example.com/test.jpg'
            },
            read,
            sentAt: new Date(),
            readAt: read ? new Date() : null
        });

        await notification.save();
        return notification;
    };

    // Test getting notifications for a user
    describe('GET /api/notifications/users/:userId', () => {
        it('should get notifications for a user', async () => {
            const userId = '607f1f77bcf86cd799439011';

            // Create test notifications
            await createTestNotification(userId, 'promotion', false);
            await createTestNotification(userId, 'order_update', true);
            await createTestNotification(userId, 'recommendation', false);

            const response = await request(app)
                .get(`/api/notifications/users/${userId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.notifications).toHaveLength(3);
            expect(response.body.data.pagination.total).toBe(3);
        });

        it('should filter notifications by read status', async () => {
            const userId = '607f1f77bcf86cd799439011';

            // Create test notifications
            await createTestNotification(userId, 'promotion', false);
            await createTestNotification(userId, 'order_update', true);
            await createTestNotification(userId, 'recommendation', false);

            const response = await request(app)
                .get(`/api/notifications/users/${userId}?read=false`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.notifications).toHaveLength(2);
            expect(response.body.data.notifications.every(n => n.read === false)).toBe(true);
        });

        it('should filter notifications by type', async () => {
            const userId = '607f1f77bcf86cd799439011';

            // Create test notifications
            await createTestNotification(userId, 'promotion', false);
            await createTestNotification(userId, 'order_update', true);
            await createTestNotification(userId, 'recommendation', false);

            const response = await request(app)
                .get(`/api/notifications/users/${userId}?type=order_update`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.notifications).toHaveLength(1);
            expect(response.body.data.notifications[0].type).toBe('order_update');
        });

        it('should apply pagination correctly', async () => {
            const userId = '607f1f77bcf86cd799439011';

            // Create multiple test notifications
            for (let i = 0; i < 15; i++) {
                await createTestNotification(userId, 'promotion', false);
            }

            const response = await request(app)
                .get(`/api/notifications/users/${userId}?limit=5&offset=5`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.notifications).toHaveLength(5);
            expect(response.body.data.pagination.total).toBe(15);
            expect(response.body.data.pagination.limit).toBe(5);
            expect(response.body.data.pagination.offset).toBe(5);
            expect(response.body.data.pagination.hasMore).toBe(true);
        });
    });

    // Test marking a notification as read
    describe('PATCH /api/notifications/users/:userId/:notificationId/read', () => {
        it('should mark a notification as read', async () => {
            const userId = '607f1f77bcf86cd799439011';
            const notification = await createTestNotification(userId, 'promotion', false);

            const response = await request(app)
                .patch(`/api/notifications/users/${userId}/${notification._id}/read`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.notification.read).toBe(true);
            expect(response.body.data.notification.readAt).not.toBeNull();

            // Verify in database
            const updatedNotification = await Notification.findById(notification._id);
            expect(updatedNotification.read).toBe(true);
            expect(updatedNotification.readAt).not.toBeNull();
        });

        it('should return error if notification does not exist', async () => {
            const userId = '607f1f77bcf86cd799439011';
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .patch(`/api/notifications/users/${userId}/${fakeId}/read`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('not found');
        });
    });

    // Test marking all notifications as read
    describe('PATCH /api/notifications/users/:userId/read-all', () => {
        it('should mark all notifications as read for a user', async () => {
            const userId = '607f1f77bcf86cd799439011';

            // Create multiple unread notifications
            await createTestNotification(userId, 'promotion', false);
            await createTestNotification(userId, 'order_update', false);
            await createTestNotification(userId, 'recommendation', false);

            const response = await request(app)
                .patch(`/api/notifications/users/${userId}/read-all`)
                .expect(200);            

            expect(response.body.success).toBe(true);
            expect(response.body.data.updated).toBe(3);

            // Verify in database
            const notifications = await Notification.find({ userId });
            expect(notifications.every(n => n.read === true)).toBe(true);
            expect(notifications.every(n => n.readAt !== null)).toBe(true);
        });

        it('should return 0 if no unread notifications exist', async () => {
            const userId = '607f1f77bcf86cd799439011';

            // Create only read notifications
            await createTestNotification(userId, 'promotion', true);
            await createTestNotification(userId, 'order_update', true);

            const response = await request(app)
                .patch(`/api/notifications/users/${userId}/read-all`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.updated).toBe(0);
        });
    });

    // Test getting unread notifications count
    describe('GET /api/notifications/users/:userId/unread-count', () => {
        it('should get the correct count of unread notifications', async () => {
            const userId = '607f1f77bcf86cd799439011';

            // Create mix of read and unread notifications
            await createTestNotification(userId, 'promotion', false);
            await createTestNotification(userId, 'order_update', true);
            await createTestNotification(userId, 'recommendation', false);

            const response = await request(app)
                .get(`/api/notifications/users/${userId}/unread-count`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBe(2);
        });

        it('should return 0 if no unread notifications exist', async () => {
            const userId = '607f1f77bcf86cd799439011';

            // Create only read notifications
            await createTestNotification(userId, 'promotion', true);
            await createTestNotification(userId, 'order_update', true);

            const response = await request(app)
                .get(`/api/notifications/users/${userId}/unread-count`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBe(0);
        });
    });

    // Test creating a notification
    describe('POST /api/notifications', () => {
        it('should create a new notification', async () => {
            const notificationData = {
                userId: '607f1f77bcf86cd799439011',
                type: 'promotion',
                title: 'New Promotion',
                content: {
                    message: 'Check out our latest sale!',
                    discount: '20%',
                    imageUrl: 'https://example.com/sale.jpg'
                },
                metadata: {
                    promotionId: 'PROMO-1234'
                }
            };

            const response = await request(app)
                .post('/api/notifications')
                .send(notificationData)
                .expect(201);
            

            expect(response.body.success).toBe(true);
            expect(response.body.data.notification).toHaveProperty('_id');
            expect(response.body.data.notification.userId).toBe(notificationData.userId);
            expect(response.body.data.notification.type).toBe(notificationData.type);
            expect(response.body.data.notification.title).toBe(notificationData.title);
            expect(response.body.data.notification.read).toBe(false);
            expect(response.body.data.notification.content).toEqual(expect.objectContaining(notificationData.content));

            // Verify in database
            const notification = await Notification.findById(response.body.data.notification._id);
            expect(notification).not.toBeNull();
            expect(notification.type).toBe(notificationData.type);
        });

        it('should return error if required fields are missing', async () => {
            const incompleteData = {
                userId: '607f1f77bcf86cd799439011',
                // Missing type, title and content
            };

            const response = await request(app)
                .post('/api/notifications')
                .send(incompleteData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });
});