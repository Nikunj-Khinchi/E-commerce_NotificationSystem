// tests/recommendation-service.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Product = require('../models/product.model');
const UserActivity = require('../models/userActivity.model');
const Recommendation = require('../models/recommendation.model');

// Mock RabbitMQ to avoid actual connections during tests
jest.mock('../utils/rabbitmq', () => ({
    connect: jest.fn().mockResolvedValue(),
    publish: jest.fn().mockResolvedValue(true),
    consume: jest.fn().mockResolvedValue(),
    close: jest.fn().mockResolvedValue()
}));

// Mock schedulers (cron jobs)
jest.mock('node-cron', () => ({
    schedule: jest.fn()
}));

describe('Recommendation Service API', () => {
    let mongoServer;
    let testProducts = [];

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
        // Create test products
        testProducts = await createTestProducts();
    });

    // Clean up database after each test
    afterEach(async () => {
        await UserActivity.deleteMany({});
        await Recommendation.deleteMany({});
    });

    // Disconnect from database and stop MongoDB Memory Server after all tests
    afterAll(async () => {
        await Product.deleteMany({});
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    // Helper function to create test products
    async function createTestProducts() {
        const products = [
            {
                name: 'Smartphone X',
                description: 'Latest smartphone with amazing features',
                price: 999.99,
                imageUrl: 'https://example.com/smartphone-x.jpg',
                category: 'electronics',
                tags: ['smartphone', 'mobile', 'tech'],
                rating: 4.5,
                inStock: true
            },
            {
                name: 'Laptop Pro',
                description: 'Powerful laptop for professionals',
                price: 1499.99,
                imageUrl: 'https://example.com/laptop-pro.jpg',
                category: 'electronics',
                tags: ['laptop', 'computer', 'tech'],
                rating: 4.7,
                inStock: true
            },
            {
                name: 'Wireless Headphones',
                description: 'Premium wireless headphones with noise cancellation',
                price: 299.99,
                imageUrl: 'https://example.com/wireless-headphones.jpg',
                category: 'electronics',
                tags: ['headphones', 'audio', 'tech'],
                rating: 4.3,
                inStock: true
            },
            {
                name: 'Summer T-Shirt',
                description: 'Comfortable cotton t-shirt for summer',
                price: 29.99,
                imageUrl: 'https://example.com/summer-tshirt.jpg',
                category: 'clothing',
                tags: ['t-shirt', 'summer', 'fashion'],
                rating: 4.1,
                inStock: true
            },
            {
                name: 'Running Shoes',
                description: 'Lightweight running shoes for athletes',
                price: 129.99,
                imageUrl: 'https://example.com/running-shoes.jpg',
                category: 'footwear',
                tags: ['shoes', 'running', 'sports'],
                rating: 4.6,
                inStock: true
            }
        ];

        return await Product.insertMany(products);
    }

    // Helper function to create user activities
    async function createUserActivities(userId, productIds) {
        const activities = [
            {
                userId,
                productId: productIds[0],
                activityType: 'view',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                metadata: {
                    viewDuration: 120 // 2 minutes
                }
            },
            {
                userId,
                productId: productIds[1],
                activityType: 'cart',
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                metadata: {
                    quantity: 1
                }
            },
            {
                userId,
                productId: productIds[2],
                activityType: 'purchase',
                timestamp: new Date(),
                metadata: {
                    orderId: 'ORD-1234',
                    quantity: 1,
                    price: 299.99
                }
            }
        ];

        return await UserActivity.insertMany(activities);
    }

    // Helper function to create a recommendation
    async function createTestRecommendation(userId, products) {
        const recommendation = new Recommendation({
            userId,
            products: products.map((product, index) => ({
                productId: product._id,
                score: 0.9 - (index * 0.1),
                reason: 'similar_purchase'
            })),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            sent: false
        });

        await recommendation.save();
        return recommendation;
    }

    // Test creating user activity
    describe('POST /api/recommendations/activities', () => {
        it('should create a new user activity', async () => {
            const activityData = {
                userId: '607f1f77bcf86cd799439011',
                productId: testProducts[0]._id,
                activityType: 'view',
                metadata: {
                    viewDuration: 120
                }
            };

            const response = await request(app)
                .post('/api/recommendations/activities')
                .send(activityData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.activity).toHaveProperty('_id');
            expect(response.body.data.activity.userId).toBe(activityData.userId);
            expect(response.body.data.activity.activityType).toBe(activityData.activityType);

            // Verify in database
            const activity = await UserActivity.findById(response.body.data.activity._id);
            expect(activity).not.toBeNull();
            expect(activity.productId.toString()).toBe(testProducts[0]._id.toString());
        });

        it('should return error if required fields are missing', async () => {
            const incompleteData = {
                userId: '607f1f77bcf86cd799439011',
                // Missing productId and activityType
            };

            const response = await request(app)
                .post('/api/recommendations/activities')
                .send(incompleteData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should return error if product does not exist', async () => {
            const invalidData = {
                userId: '607f1f77bcf86cd799439011',
                productId: new mongoose.Types.ObjectId(), // Non-existent product
                activityType: 'view'
            };

            const response = await request(app)
                .post('/api/recommendations/activities')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Product not found');
        });
    });

    // Test get recommendations for a user
    describe('GET /api/recommendations/users/:userId', () => {
        it('should get recommendations for a user', async () => {
            const userId = '607f1f77bcf86cd799439011';

            // Create user activities first
            await createUserActivities(userId, testProducts.map(p => p._id));

            // Create a recommendation
            await createTestRecommendation(userId, testProducts.slice(0, 3));

            const response = await request(app)
                .get(`/api/recommendations/users/${userId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.recommendations).toHaveProperty('id');
            expect(response.body.data.recommendations.userId).toBe(userId);
            expect(response.body.data.recommendations.products).toHaveLength(3);
            expect(response.body.data.recommendations.products[0]).toHaveProperty('product');
            expect(response.body.data.recommendations.products[0]).toHaveProperty('score');
            expect(response.body.data.recommendations.products[0]).toHaveProperty('reason');
        });

        // it('should generate new recommendations if none exist', async () => {
        //     const userId = '607f1f77bcf86cd799439011';

        //     // Create user activities first
        //     await createUserActivities(userId, testProducts.map(p => p._id));

        //     const response = await request(app)
        //         .get(`/api/recommendations/users/${userId}`)

        //     console.log("if none exist", response.body);
            
        //     expect(response.body.success).toBe(true);
        //     expect(response.body.data.recommendations).toHaveProperty('id');
        //     expect(response.body.data.recommendations.userId).toBe(userId);
        //     expect(response.body.data.recommendations.products.length).toBeGreaterThan(0);
        // });
    });

    // Test generate recommendations for a user
    describe('POST /api/recommendations/users/:userId/generate', () => {
        it('should generate recommendations for a user with preferences', async () => {
            const userId = '607f1f77bcf86cd799439011';
            const preferences = {
                categories: ['electronics', 'clothing']
            };

            // Create user activities first
            await createUserActivities(userId, testProducts.map(p => p._id));

            const response = await request(app)
                .post(`/api/recommendations/users/${userId}/generate`)
                .send({ preferences })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.recommendations).toHaveProperty('_id');
            expect(response.body.data.recommendations.userId).toBe(userId);
            expect(response.body.data.recommendations.products.length).toBeGreaterThan(0);

            // Verify that preferences were used (electronics and clothing categories)
            const electronicProducts = testProducts.filter(p => p.category === 'electronics').map(p => p._id.toString());
            const clothingProducts = testProducts.filter(p => p.category === 'clothing').map(p => p._id.toString());

            // Check if at least one recommended product is from the preferred categories
            const recommendedProductIds = response.body.data.recommendations.products.map(p => p.productId);
            const hasPreferredProduct = recommendedProductIds.some(id =>
                electronicProducts.includes(id) || clothingProducts.includes(id)
            );

            expect(hasPreferredProduct).toBe(true);
        });

        it('should generate recommendations even without user activities', async () => {
            const userId = '607f1f77bcf86cd799439999'; // User with no activities

            const response = await request(app)
                .post(`/api/recommendations/users/${userId}/generate`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.recommendations).toHaveProperty('_id');
            expect(response.body.data.recommendations.userId).toBe(userId);
            expect(response.body.data.recommendations.products.length).toBeGreaterThan(0);
        });
    });

    // Test batch recommendations generation
    describe('POST /api/recommendations/batch', () => {
        it('should generate batch recommendations for multiple users', async () => {
            const userId1 = '607f1f77bcf86cd799439011';
            const userId2 = '607f1f77bcf86cd799439012';

            // Create activities for two users
            await createUserActivities(userId1, testProducts.map(p => p._id));
            await createUserActivities(userId2, testProducts.map(p => p._id));

            const response = await request(app)
                .post('/api/recommendations/batch')
                .expect(200);

            console.log("batch", response.body);
            

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('success');
            expect(response.body.data).toHaveProperty('failed');
            expect(response.body.data).toHaveProperty('total');
            // expect(response.body.data.success).toBeGreaterThanOrEqual(2); // At least our 2 users

            // // Verify in database
            // const recommendations = await Recommendation.find({
            //     userId: { $in: [userId1, userId2] }
            // });

            // expect(recommendations.length).toBeGreaterThanOrEqual(2);
        });
    });

    // Test marking a recommendation as sent
    describe('PATCH /api/recommendations/:recommendationId/sent', () => {
        it('should mark a recommendation as sent', async () => {
            const userId = '607f1f77bcf86cd799439011';

            // Create a recommendation
            const recommendation = await createTestRecommendation(userId, testProducts.slice(0, 3));

            const response = await request(app)
                .patch(`/api/recommendations/${recommendation._id}/sent`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.recommendation.sent).toBe(true);
            expect(response.body.data.recommendation.sentAt).not.toBeNull();

            // Verify in database
            const updatedRecommendation = await Recommendation.findById(recommendation._id);
            expect(updatedRecommendation.sent).toBe(true);
            expect(updatedRecommendation.sentAt).not.toBeNull();
        });

        it('should return error if recommendation does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .patch(`/api/recommendations/${fakeId}/sent`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('not found');
        });
    });
});