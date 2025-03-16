// services/recommendation-service/src/models/recommendation.model.js
const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 1
        },
        reason: {
            type: String,
            required: true,
            enum: ['similar_purchase', 'similar_view', 'popular_in_category', 'trending', 'frequently_bought_together', 'wishlist_recommendation']
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    sent: {
        type: Boolean,
        default: false
    },
    sentAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Create indexes for faster queries
recommendationSchema.index({ userId: 1, createdAt: -1 });
recommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;