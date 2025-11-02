const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  changePassword,
  getStatistics
} = require('../controllers/userController');
const { protect, checkVerified } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);
router.use(checkVerified);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', updateProfile);

// @route   POST /api/users/profile-photo
// @desc    Update profile photo
// @access  Private
router.post('/profile-photo', upload.single('photo'), updateProfilePhoto);

// @route   PUT /api/users/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', changePassword);

// @route   GET /api/users/statistics
// @desc    Get user statistics
// @access  Private
router.get('/statistics', getStatistics);

module.exports = router;