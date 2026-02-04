const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

// Reuse getMe for profile
router.get('/profile', verifyToken, authController.getMe);

module.exports = router;
