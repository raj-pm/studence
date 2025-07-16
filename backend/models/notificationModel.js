// models/notificationModel.js
import supabase from '../supabaseClient.js';

export const getUserNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipientId', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
