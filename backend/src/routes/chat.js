const express = require('express');
const router = express.Router();
const {
  getChats,
  getChat,
  createChat,
  sendMessage,
  markAsRead,
  getUnreadCount,
  deleteChat
} = require('../controllers/chatController');
const { protect, checkVerified } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);
router.use(checkVerified);

// @route   GET /api/chats
// @desc    Get all user's chats
// @access  Private
router.get('/', getChats);

// @route   GET /api/chats/unread-count
// @desc    Get unread message count
// @access  Private
router.get('/unread-count', getUnreadCount);

// @route   POST /api/chats
// @desc    Create or get chat
// @access  Private
router.post('/', createChat);

// @route   GET /api/chats/:id
// @desc    Get single chat with messages
// @access  Private
router.get('/:id', getChat);

// @route   POST /api/chats/:id/messages
// @desc    Send message in chat
// @access  Private
router.post('/:id/messages', sendMessage);

// @route   PUT /api/chats/:id/read
// @desc    Mark messages as read
// @access  Private
router.put('/:id/read', markAsRead);

// @route   DELETE /api/chats/:id
// @desc    Delete chat
// @access  Private
router.delete('/:id', deleteChat);

module.exports = router;