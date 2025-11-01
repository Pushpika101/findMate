const { query } = require('../config/database');
const { createNotification } = require('../services/notificationService');

// @desc    Get all user's chats
// @route   GET /api/chats
// @access  Private
exports.getChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT 
        c.id,
        c.item_id,
        c.last_message,
        c.last_message_time,
        c.created_at,
        i.item_name,
        i.type as item_type,
        i.photo1_url as item_photo,
        CASE 
          WHEN c.user1_id = $1 THEN c.user2_id
          ELSE c.user1_id
        END as other_user_id,
        CASE 
          WHEN c.user1_id = $1 THEN u2.name
          ELSE u1.name
        END as other_user_name,
        CASE 
          WHEN c.user1_id = $1 THEN u2.profile_photo
          ELSE u1.profile_photo
        END as other_user_photo,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.chat_id = c.id 
          AND m.sender_id != $1 
          AND m.is_read = false
        ) as unread_count
      FROM chats c
      JOIN items i ON c.item_id = i.id
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY COALESCE(c.last_message_time, c.created_at) DESC
    `, [userId]);

    res.json({
      success: true,
      count: result.rows.length,
      data: {
        chats: result.rows
      }
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chats'
    });
  }
};

// @desc    Get single chat with messages
// @route   GET /api/chats/:id
// @access  Private
exports.getChat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get chat details
    const chatResult = await query(`
      SELECT 
        c.*,
        i.item_name,
        i.type as item_type,
        i.photo1_url as item_photo,
        i.location,
        CASE 
          WHEN c.user1_id = $1 THEN c.user2_id
          ELSE c.user1_id
        END as other_user_id,
        CASE 
          WHEN c.user1_id = $1 THEN u2.name
          ELSE u1.name
        END as other_user_name,
        CASE 
          WHEN c.user1_id = $1 THEN u2.profile_photo
          ELSE u1.profile_photo
        END as other_user_photo
      FROM chats c
      JOIN items i ON c.item_id = i.id
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.id = $2 AND (c.user1_id = $1 OR c.user2_id = $1)
    `, [userId, id]);

    if (chatResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied'
      });
    }

    // Get messages
    const messagesResult = await query(`
      SELECT 
        m.*,
        u.name as sender_name,
        u.profile_photo as sender_photo
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC
    `, [id]);

    // Mark messages as read
    await query(`
      UPDATE messages 
      SET is_read = true 
      WHERE chat_id = $1 AND sender_id != $2
    `, [id, userId]);

    res.json({
      success: true,
      data: {
        chat: chatResult.rows[0],
        messages: messagesResult.rows
      }
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat'
    });
  }
};

// @desc    Create or get chat for an item
// @route   POST /api/chats
// @access  Private
exports.createChat = async (req, res) => {
  try {
    const { itemId, recipientId } = req.body;
    const userId = req.user.id;

    if (!itemId || !recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide itemId and recipientId'
      });
    }

    // Verify item exists
    const itemCheck = await query('SELECT * FROM items WHERE id = $1', [itemId]);
    
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if chat already exists
    const existingChat = await query(`
      SELECT id FROM chats 
      WHERE item_id = $1 
      AND ((user1_id = $2 AND user2_id = $3) OR (user1_id = $3 AND user2_id = $2))
    `, [itemId, userId, recipientId]);

    if (existingChat.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Chat already exists',
        data: {
          chatId: existingChat.rows[0].id
        }
      });
    }

    // Create new chat
    const result = await query(`
      INSERT INTO chats (item_id, user1_id, user2_id)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [itemId, userId, recipientId]);

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: {
        chatId: result.rows[0].id
      }
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chat'
    });
  }
};

// @desc    Send message
// @route   POST /api/chats/:id/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message_text } = req.body;
    const userId = req.user.id;
    const io = req.app.get('io');

    if (!message_text || message_text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    // Verify user is part of the chat
    const chatCheck = await query(`
      SELECT * FROM chats 
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `, [id, userId]);

    if (chatCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied'
      });
    }

    const chat = chatCheck.rows[0];
    const recipientId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;

    // Insert message
    const result = await query(`
      INSERT INTO messages (chat_id, sender_id, message_text)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [id, userId, message_text]);

    const message = result.rows[0];

    // Update last message in chat
    await query(`
      UPDATE chats 
      SET last_message = $1, last_message_time = NOW()
      WHERE id = $2
    `, [message_text, id]);

    // Get sender info
    const senderInfo = await query(
      'SELECT name, profile_photo FROM users WHERE id = $1',
      [userId]
    );

    const messageWithSender = {
      ...message,
      sender_name: senderInfo.rows[0].name,
      sender_photo: senderInfo.rows[0].profile_photo
    };

    // Emit message via Socket.IO
    io.to(`chat_${id}`).emit('new_message', messageWithSender);

    // Send notification to recipient
    await createNotification(
      recipientId,
      'new_message',
      'New Message',
      `${req.user.name} sent you a message`,
      chat.item_id,
      io
    );

    res.status(201).json({
      success: true,
      data: {
        message: messageWithSender
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chats/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is part of the chat
    const chatCheck = await query(`
      SELECT * FROM chats 
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `, [id, userId]);

    if (chatCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied'
      });
    }

    // Mark all messages from other user as read
    await query(`
      UPDATE messages 
      SET is_read = true 
      WHERE chat_id = $1 AND sender_id != $2
    `, [id, userId]);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read'
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/chats/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      WHERE (c.user1_id = $1 OR c.user2_id = $1)
      AND m.sender_id != $1
      AND m.is_read = false
    `, [userId]);

    res.json({
      success: true,
      data: {
        unreadCount: parseInt(result.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count'
    });
  }
};

// @desc    Delete chat
// @route   DELETE /api/chats/:id
// @access  Private
exports.deleteChat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is part of the chat
    const chatCheck = await query(`
      SELECT * FROM chats 
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `, [id, userId]);

    if (chatCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied'
      });
    }

    // Delete chat (messages will be deleted via CASCADE)
    await query('DELETE FROM chats WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting chat'
    });
  }
};