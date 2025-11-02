const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserDetails,
  banUser,
  getAllItems,
  deleteItem,
  getStatistics
} = require('../controllers/adminController');
const { protect, checkVerified, checkAdmin } = require('../middleware/auth');

// Apply authentication and admin check to all routes
router.use(protect);
router.use(checkVerified);
router.use(checkAdmin);

// User Management
// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', getAllUsers);

// @route   GET /api/admin/users/:id
// @desc    Get user details
// @access  Private/Admin
router.get('/users/:id', getUserDetails);

// @route   DELETE /api/admin/users/:id
// @desc    Ban/Delete user
// @access  Private/Admin
router.delete('/users/:id', banUser);

// Item Management
// @route   GET /api/admin/items
// @desc    Get all items
// @access  Private/Admin
router.get('/items', getAllItems);

// @route   DELETE /api/admin/items/:id
// @desc    Delete item
// @access  Private/Admin
router.delete('/items/:id', deleteItem);

// Statistics
// @route   GET /api/admin/statistics
// @desc    Get system statistics
// @access  Private/Admin
router.get('/statistics', getStatistics);

module.exports = router;