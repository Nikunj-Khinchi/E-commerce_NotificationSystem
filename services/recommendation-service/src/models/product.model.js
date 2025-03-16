// services/recommendation-service/src/models/product.model.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    imageUrl: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        index: true
    },
    tags: {
        type: [String],
        default: [],
        index: true
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    inStock: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create indexes for faster queries
productSchema.index({ category: 1, rating: -1 });
productSchema.index({ tags: 1 });

// Add mock data initialization
productSchema.statics.initMockData = async function () {
    const count = await this.countDocuments();

    if (count === 0) {
        const mockProducts = [
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
                name: 'Denim Jeans',
                description: 'Classic denim jeans for everyday wear',
                price: 49.99,
                imageUrl: 'https://example.com/denim-jeans.jpg',
                category: 'clothing',
                tags: ['jeans', 'denim', 'fashion'],
                rating: 4.4,
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
            },
            {
                name: 'Coffee Table',
                description: 'Modern coffee table for your living room',
                price: 199.99,
                imageUrl: 'https://example.com/coffee-table.jpg',
                category: 'furniture',
                tags: ['table', 'living room', 'home'],
                rating: 4.2,
                inStock: true
            },
            {
                name: 'Decorative Lamp',
                description: 'Elegant lamp for home decoration',
                price: 79.99,
                imageUrl: 'https://example.com/decorative-lamp.jpg',
                category: 'home',
                tags: ['lamp', 'lighting', 'decor'],
                rating: 4.0,
                inStock: true
            },
            {
                name: 'Kitchen Blender',
                description: 'High-performance blender for your kitchen',
                price: 149.99,
                imageUrl: 'https://example.com/kitchen-blender.jpg',
                category: 'appliances',
                tags: ['blender', 'kitchen', 'home'],
                rating: 4.5,
                inStock: true
            },
            {
                name: 'Yoga Mat',
                description: 'Non-slip yoga mat for your workouts',
                price: 39.99,
                imageUrl: 'https://example.com/yoga-mat.jpg',
                category: 'fitness',
                tags: ['yoga', 'fitness', 'sports'],
                rating: 4.3,
                inStock: true
            }
        ];

        await this.insertMany(mockProducts);
        logger.info('Added mock products data');
    }
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;