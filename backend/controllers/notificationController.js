import supabase from '../supabaseClient.js';

// Get notifications for the logged-in user
export const getNotifications = async (req, res) => {
  const recipientId = req.user.uid; // Get recipient ID from authenticated user

  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching notifications:', error.message);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    res.status(200).json(notifications);
  } catch (err) {
    console.error('❌ Unexpected error in getNotifications:', err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};

// Mark notifications as seen
export const markNotificationsAsSeen = async (req, res) => {
  const recipientId = req.user.uid; // Get recipient ID from authenticated user
  const { notificationId } = req.params; // Optional: if marking a single notification

  try {
    let query = supabase.from('notifications').update({ read: true });

    if (notificationId) {
      // Mark a specific notification as read
      query = query.eq('id', notificationId).eq('recipient_id', recipientId);
    } else {
      // Mark all notifications for the user as read
      query = query.eq('recipient_id', recipientId);
    }

    const { error } = await query;

    if (error) {
      console.error('❌ Error marking notifications as seen:', error.message);
      return res.status(500).json({ error: 'Failed to update notifications' });
    }

    res.status(200).json({ message: 'Notifications marked as seen' });
  } catch (err) {
    console.error('❌ Unexpected error in markNotificationsAsSeen:', err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
