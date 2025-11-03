const { query } = require('../config/database');
const { getTokensForUser, sendPushToTokens } = require('./pushService');

// Create a new notification
const createNotification = async (userId, type, title, message, relatedItemId = null, io = null) => {
  try {
    const result = await query(`
      INSERT INTO notifications (user_id, type, title, message, related_item_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, type, title, message, relatedItemId]);

    const notification = result.rows[0];

    // Send real-time notification via Socket.IO if available
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', notification);
    }

    // Also send push notification via Expo (if tokens exist). Do not fail overall if push fails.
    try {
      const tokens = await getTokensForUser(userId);
      console.log(`createNotification: found ${tokens?.length || 0} device token(s) for user ${userId}`);
      if (tokens && tokens.length > 0) {
        // Send a simple push message: title and body
        const result = await sendPushToTokens(tokens, {
          title: title,
          body: message,
          data: { relatedItemId, type }
        });
        console.log('createNotification: push send result:', result);
      }
    } catch (pushErr) {
      console.error('Error sending push in createNotification:', pushErr);
      // continue without throwing to keep DB write successful
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Send notification to all users (for new items)
const notifyAllUsers = async (type, title, message, relatedItemId, excludeUserId, io) => {
  try {
    // Get all verified users except the one who created the item
    const users = await query(
      'SELECT id FROM users WHERE is_verified = true AND id != $1',
      [excludeUserId]
    );

    const notifications = [];
    
    for (const user of users.rows) {
      const notification = await createNotification(
        user.id,
        type,
        title,
        message,
        relatedItemId,
        io
      );
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('Error notifying all users:', error);
    throw error;
  }
};

// Get user notifications
const getUserNotifications = async (userId, limit = 50) => {
  try {
    const result = await query(`
      SELECT n.*, i.item_name, i.photo1_url, i.type as item_type
      FROM notifications n
      LEFT JOIN items i ON n.related_item_id = i.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

// Get unread notification count
const getUnreadCount = async (userId) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

// Mark notification as read
const markAsRead = async (notificationId, userId) => {
  try {
    const result = await query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [notificationId, userId]);

    return result.rows[0];
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
const markAllAsRead = async (userId) => {
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [userId]
    );

    return true;
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};

// Delete notification
const deleteNotification = async (notificationId, userId) => {
  try {
    await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Clear old notifications (older than 30 days)
const clearOldNotifications = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await query(
      'DELETE FROM notifications WHERE created_at < $1',
      [thirtyDaysAgo]
    );

    console.log(`Cleared ${result.rowCount} old notifications`);
    return result.rowCount;
  } catch (error) {
    console.error('Error clearing old notifications:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  notifyAllUsers,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearOldNotifications
};