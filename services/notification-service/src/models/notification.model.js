// services/notification-service/src/models/notification.model.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['promotion', 'order_update', 'recommendation']
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    readAt: {
        type: Date,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for faster queries
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ sentAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;