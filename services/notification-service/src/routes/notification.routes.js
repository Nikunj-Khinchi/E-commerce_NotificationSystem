// services/notification-service/src/routes/notification.routes.js
const express = require('express');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

// Get notifications for a user
router.get('/users/:userId', notificationController.getUserNotifications);

// Get unread notifications count for a user
router.get('/users/:userId/unread-count', notificationController.getUnreadCount);

// Mark a notification as read
router.patch('/users/:userId/:notificationId/read', notificationController.markNotificationAsRead);

// Mark all notifications as read for a user
router.patch('/users/:userId/read-all', notificationController.markAllNotificationsAsRead);

// Create a new notification
router.post('/', notificationController.createNotification);

module.exports = router;