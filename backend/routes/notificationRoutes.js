import express from 'express';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';
import { getNotifications, markNotificationsAsSeen } from '../controllers/notificationController.js';

const router = express.Router();

// Get all notifications for the logged-in user
router.get('/', verifyFirebaseToken, getNotifications);

// Mark a specific notification as seen
router.put('/mark-as-seen/:notificationId', verifyFirebaseToken, markNotificationsAsSeen);

// Mark all notifications as seen (NEW: Separate route for optional param)
router.put('/mark-as-seen', verifyFirebaseToken, markNotificationsAsSeen);

export default router;
