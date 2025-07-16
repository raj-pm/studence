const express = require('express');
const router = express.Router();
const { getUserPosts, getNotifications, getProfile } = require('../controllers/navbarController');
const authenticate = require('../middleware/auth');

router.get('/your-posts', authenticate, getUserPosts);
router.get('/notifications', authenticate, getNotifications);
router.get('/profile', authenticate, getProfile);

module.exports = router;
