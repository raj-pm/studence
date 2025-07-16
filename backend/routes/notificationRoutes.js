import express from 'express';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';
import { getUserNotifications } from '../models/notificationModel.js';

const router = express.Router();

router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user.uid);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
});

export default router;
