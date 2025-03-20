// tests/user-service.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/user.model');

// Mock RabbitMQ to avoid actual connections during tests
jest.mock('../utils/rabbitmq', () => ({
    connect: jest.fn().mockResolvedValue(),
    publish: jest.fn().mockResolvedValue(true),
    consume: jest.fn().mockResolvedValue(),
    close: jest.fn().mockResolvedValue()
}));

describe('User Service API', () => {
    let mongoServer;
    // Setup MongoDB Memory Server
    beforeAll(async () => {
        try {
            // Close any existing connections
            await mongoose.disconnect();

            // Create new server instance
            mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();

            // Connect with specific options
            await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
        } catch (error) {
            console.error('MongoDB setup failed:', error);
            throw error;
        }
    });

    beforeEach(async () => {
        try {
            // Clear all collections before each test
            await Promise.all(
                Object.values(mongoose.connection.collections).map(collection =>
                    collection.deleteMany({})
                )
            );
        } catch (error) {
            console.error('Collection cleanup failed:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            // Close mongoose connection
            await mongoose.disconnect();

            // Stop MongoDB server
            if (mongoServer) {
                await mongoServer.stop();
            }

            // Close any remaining handles
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error('Cleanup failed:', error);
            throw error;
        }
    });

    // Test user registration
    describe('POST /api/users/register', () => {
        it('should register a new user', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                preferences: {
                    notifications: {
                        promotions: true,
                        order_updates: true,
                        recommendations: false
                    },
                    categories: ['electronics', 'books']
                }
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('_id');
            expect(response.body.data.user.name).toBe(userData.name);
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.token).toBeDefined();
        });

        it('should return error if user already exists', async () => {
            const userData = {
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123'
            };

            // Create a user first
            await request(app)
                .post('/api/users/register')
                .send(userData)
                .expect(201);

            // Try to create the same user again
            const response = await request(app)
                .post('/api/users/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });
    });

    // Test user login
    describe('POST /api/users/login', () => {
        it('should login a user with valid credentials', async () => {
            // Register a user first
            const userData = {
                name: 'Test User',
                email: 'login@example.com',
                password: 'password123'
            };

            await request(app)
                .post('/api/users/register')
                .send(userData)
                .expect(201);

            // Login
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: userData.email,
                    password: userData.password
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('_id');
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.token).toBeDefined();
        });

        it('should return error with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'invalid@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    // Test getting user details
    describe('GET /api/users/me', () => {
        it('should get authenticated user details', async () => {
            // Register a user first
            const userData = {
                name: 'Test User',
                email: 'getme@example.com',
                password: 'password123'
            };

            const registerResponse = await request(app)
                .post('/api/users/register')
                .send(userData)
                .expect(201);

            const token = registerResponse.body.data.token;

            // Get user details
            const response = await request(app)
                .get('/api/users/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('_id');
            expect(response.body.data.user.email).toBe(userData.email);
        });

        it('should return error if not authenticated', async () => {
            const response = await request(app)
                .get('/api/users/me')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    // Test updating user preferences
    describe('PATCH /api/users/preferences', () => {
        it('should update user preferences', async () => {
            // Register a user first
            const userData = {
                name: 'Test User',
                email: 'preferences@example.com',
                password: 'password123',
                preferences: {
                    notifications: {
                        promotions: true,
                        order_updates: true,
                        recommendations: true
                    },
                    categories: ['electronics']
                }
            };

            const registerResponse = await request(app)
                .post('/api/users/register')
                .send(userData)
                .expect(201);

            const token = registerResponse.body.data.token;

            // Update preferences
            const newPreferences = {
                notifications: {
                    promotions: false,
                    order_updates: true,
                    recommendations: false
                },
                categories: ['books', 'clothing']
            };

            const response = await request(app)
                .patch('/api/users/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send({ preferences: newPreferences })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('_id');
            expect(response.body.data.user.preferences.notifications.promotions).toBe(false);
            expect(response.body.data.user.preferences.notifications.recommendations).toBe(false);
            expect(response.body.data.user.preferences.categories).toEqual(expect.arrayContaining(['books', 'clothing']));
        });

        it('should return error if not authenticated', async () => {
            const response = await request(app)
                .patch('/api/users/preferences')
                .send({ preferences: {} })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});