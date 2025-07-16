const db = require('../utils/db');

exports.getNotifications = async (req, res) => {
  const { user } = req.params;
  try {
    const result = await db.query(
      `SELECT notifications.*, comments.content AS comment_text
       FROM notifications
       JOIN comments ON comments.id = notifications.comment_id
       WHERE notifications.user_name = $1 AND seen = FALSE
       ORDER BY notifications.created_at DESC`,
      [user]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.markAllAsSeen = async (req, res) => {
  const { user } = req.params;
  try {
    await db.query('UPDATE notifications SET seen = TRUE WHERE user_name = $1', [user]);
    res.json({ message: 'Notifications marked as seen' });
  } catch (err) {
    console.error('❌ Error marking notifications:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};
