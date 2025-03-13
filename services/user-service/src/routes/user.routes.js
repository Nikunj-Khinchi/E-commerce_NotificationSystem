// services/user-service/src/routes/user.routes.js
const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected routes
router.get('/me', authenticate, userController.getUserDetails);
router.patch('/preferences', authenticate, userController.updateUserPreferences);

module.exports = router;