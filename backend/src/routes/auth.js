const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  verifyEmail,
  resendVerification,
  sendOtp,
  verifyOtp,
  login,
  getMe,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect, validateCampusEmail } = require('../middleware/auth');

// Validation middleware
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', validateCampusEmail, registerValidation, register);

// @route   POST /api/auth/verify-email
// @desc    Verify email with token
// @access  Public
router.post('/verify-email', verifyEmail);
// Also support GET so verification links in emails can call the endpoint directly
router.get('/verify-email', verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', resendVerification);

// New OTP endpoints
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
// Password reset using short OTP flow
router.post('/forgot-password-otp', require('../controllers/authController').forgotPasswordOtp);
router.post('/verify-reset-otp', require('../controllers/authController').verifyResetOtp);
router.post('/reset-password-otp', require('../controllers/authController').resetPasswordWithOtp);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, login);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, getMe);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', resetPassword);

module.exports = router;