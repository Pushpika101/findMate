const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
const { sendVerificationEmail, sendPasswordResetEmail, sendVerificationOtpEmail, sendPasswordResetOtpEmail } = require('../config/email');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, name, student_id } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and name'
      });
    }

    // Enforce allowed email domain if configured (e.g., pdn.ac.lk)
    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
    if (allowedDomain) {
      const e = String(email).toLowerCase();
      const domainLower = allowedDomain.toLowerCase();
      if (!(e.endsWith(`@${domainLower}`) || e.endsWith(`.${domainLower}`))) {
        return res.status(400).json({
          success: false,
          message: `Registration is restricted to ${allowedDomain} email addresses`
        });
      }
    }

    // Check if user exists
    const userExists = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP and expiry (15 minutes)
    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const otpSalt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, otpSalt);

    // Create user and store otp hash & expiry
    const result = await query(`
      INSERT INTO users (email, password, name, student_id, verification_otp_hash, verification_otp_expires, verification_otp_attempts)
      VALUES ($1, $2, $3, $4, $5, $6, 0)
      RETURNING id, email, name, student_id, is_verified, created_at
    `, [email, hashedPassword, name, student_id, otpHash, otpExpires]);

    const user = result.rows[0];

    // Send OTP email
    try {
      await sendVerificationOtpEmail(email, name, otp);
    } catch (e) {
      console.warn('Failed to send OTP email:', e.message || e);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the verification code.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          student_id: user.student_id,
          is_verified: user.is_verified
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    // Accept token from POST body or GET query so the same controller can be
    // used for API calls and for a simple web verification link.
    const token = req.body?.token || req.query?.token;
    const isWebFlow = !!req.query?.token; // if token present in query, we'll redirect to frontend

    if (!token) {
      if (isWebFlow) {
        const redirectTo = `${process.env.CLIENT_URL_WEB || process.env.CLIENT_URL || 'http://localhost:5173'}/verified?status=error&message=missing_token`;
        return res.redirect(302, redirectTo);
      }
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with token and valid expiry
    const result = await query(
      'SELECT id, verification_expires FROM users WHERE verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      if (isWebFlow) {
        const redirectTo = `${process.env.CLIENT_URL_WEB || process.env.CLIENT_URL || 'http://localhost:5173'}/verified?status=error&message=invalid_token`;
        return res.redirect(302, redirectTo);
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    const user = result.rows[0];
    if (user.verification_expires && new Date(user.verification_expires) < new Date()) {
      if (isWebFlow) {
        const redirectTo = `${process.env.CLIENT_URL_WEB || process.env.CLIENT_URL || 'http://localhost:5173'}/verified?status=error&message=token_expired`;
        return res.redirect(302, redirectTo);
      }
      return res.status(400).json({ success: false, message: 'Verification token expired' });
    }

    // Update user as verified
    await query(`
      UPDATE users 
      SET is_verified = true, verification_token = NULL, verification_expires = NULL 
      WHERE id = $1
    `, [user.id]);

    if (isWebFlow) {
      const redirectTo = `${process.env.CLIENT_URL_WEB || process.env.CLIENT_URL || 'http://localhost:5173'}/verified?status=success`;
      return res.redirect(302, redirectTo);
    }

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login.'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Prevent login if email not verified
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          student_id: user.student_id,
          profile_photo: user.profile_photo,
          is_verified: user.is_verified,
          is_admin: user.is_admin
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Find user
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await query(`
      UPDATE users 
      SET reset_password_token = $1, reset_password_expires = $2 
      WHERE id = $3
    `, [resetToken, resetExpires, user.id]);

    // Send reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending reset email'
    });
  }
};

// @desc    Send verification OTP (resend)
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Please provide email' });

    const result = await query('SELECT id, name, is_verified FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Generic success
      return res.json({ success: true, message: 'If an account exists and is not verified, a verification code has been sent.' });
    }

    const user = result.rows[0];
    if (user.is_verified) return res.status(400).json({ success: false, message: 'Account is already verified' });

    // Generate new OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    const otpHash = await bcrypt.hash(otp, await bcrypt.genSalt(10));

    await query('UPDATE users SET verification_otp_hash=$1, verification_otp_expires=$2, verification_otp_attempts=0 WHERE email=$3', [otpHash, otpExpires, email]);

    try {
      await sendVerificationOtpEmail(email, user.name || '', otp);
    } catch (e) {
      console.warn('Failed to send OTP email:', e.message || e);
    }

    return res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Error sending verification code' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Please provide email and code' });

    const result = await query('SELECT id, verification_otp_hash, verification_otp_expires, verification_otp_attempts, verification_otp_locked_until FROM users WHERE email=$1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid code or email' });

    const user = result.rows[0];
    if (!user.verification_otp_hash) return res.status(400).json({ success: false, message: 'No active verification code. Please request a new one.' });

    if (user.verification_otp_locked_until && new Date(user.verification_otp_locked_until) > new Date()) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Try again later.' });
    }

    if (!user.verification_otp_expires || new Date(user.verification_otp_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code expired. Please request a new one.' });
    }

    const ok = await bcrypt.compare(String(otp), user.verification_otp_hash);
    if (!ok) {
      // increment attempts
      const attempts = (user.verification_otp_attempts || 0) + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // lock 30m after 5 attempts
      await query('UPDATE users SET verification_otp_attempts=$1, verification_otp_locked_until=$2 WHERE email=$3', [attempts, lockUntil, email]);
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // mark verified
    await query('UPDATE users SET is_verified=true, verification_otp_hash=NULL, verification_otp_expires=NULL, verification_otp_attempts=0, verification_otp_locked_until=NULL WHERE email=$1', [email]);

    return res.json({ success: true, message: 'Account verified' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Error verifying code' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and new password'
      });
    }

    // Find user with valid token
    const result = await query(`
      SELECT id FROM users 
      WHERE reset_password_token = $1 
      AND reset_password_expires > NOW()
    `, [token]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    await query(`
      UPDATE users 
      SET password = $1, reset_password_token = NULL, reset_password_expires = NULL 
      WHERE id = $2
    `, [hashedPassword, result.rows[0].id]);

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

// @desc    Forgot password (send numeric OTP)
// @route   POST /api/auth/forgot-password-otp
// @access  Public
exports.forgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Please provide email' });

    const result = await query('SELECT id, name FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // respond generically
      return res.json({ success: true, message: 'If an account exists, a reset code has been sent.' });
    }

    const user = result.rows[0];

    // ensure reset otp columns exist (idempotent)
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_hash VARCHAR(255)`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMP`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_attempts INTEGER DEFAULT 0`);
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_locked_until TIMESTAMP`);
    } catch (e) {
      // ignore - some DBs may not support IF NOT EXISTS but most do
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const otpHash = await bcrypt.hash(otp, await bcrypt.genSalt(10));

    await query('UPDATE users SET reset_otp_hash=$1, reset_otp_expires=$2, reset_otp_attempts=0 WHERE email=$3', [otpHash, otpExpires, email]);

    try {
      await sendPasswordResetOtpEmail(email, user.name || '', otp);
    } catch (e) {
      console.warn('Failed to send reset OTP email:', e.message || e);
    }

    return res.json({ success: true, message: 'If an account exists, a reset code has been sent.' });
  } catch (error) {
    console.error('forgotPasswordOtp error:', error);
    res.status(500).json({ success: false, message: 'Error sending reset code' });
  }
};

// @desc    Verify reset OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Please provide email and code' });

    const result = await query('SELECT reset_otp_hash, reset_otp_expires, reset_otp_attempts, reset_otp_locked_until FROM users WHERE email=$1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid email or code' });

    const user = result.rows[0];
    if (!user.reset_otp_hash) return res.status(400).json({ success: false, message: 'No active reset code. Please request a new one.' });

    if (user.reset_otp_locked_until && new Date(user.reset_otp_locked_until) > new Date()) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Try again later.' });
    }

    if (!user.reset_otp_expires || new Date(user.reset_otp_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset code expired. Please request a new one.' });
    }

    const ok = await bcrypt.compare(String(otp), user.reset_otp_hash);
    if (!ok) {
      const attempts = (user.reset_otp_attempts || 0) + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
      await query('UPDATE users SET reset_otp_attempts=$1, reset_otp_locked_until=$2 WHERE email=$3', [attempts, lockUntil, email]);
      return res.status(400).json({ success: false, message: 'Invalid reset code' });
    }

    return res.json({ success: true, message: 'Code valid' });
  } catch (error) {
    console.error('verifyResetOtp error:', error);
    res.status(500).json({ success: false, message: 'Error verifying code' });
  }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password-otp
// @access  Public
exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) return res.status(400).json({ success: false, message: 'Please provide email, code and new password' });

    const result = await query('SELECT id, reset_otp_hash, reset_otp_expires FROM users WHERE email=$1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid email or code' });

    const user = result.rows[0];
    if (!user.reset_otp_hash) return res.status(400).json({ success: false, message: 'No active reset code. Please request a new one.' });
    if (!user.reset_otp_expires || new Date(user.reset_otp_expires) < new Date()) return res.status(400).json({ success: false, message: 'Reset code expired. Please request a new one.' });

    const ok = await bcrypt.compare(String(otp), user.reset_otp_hash);
    if (!ok) return res.status(400).json({ success: false, message: 'Invalid reset code' });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear reset otp
    await query('UPDATE users SET password=$1, reset_otp_hash=NULL, reset_otp_expires=NULL, reset_otp_attempts=0, reset_otp_locked_until=NULL WHERE id=$2', [hashedPassword, user.id]);

    return res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('resetPasswordWithOtp error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    // Find user by email
    const result = await query('SELECT id, name, is_verified FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Don't reveal whether the email exists — return generic success
      return res.json({ success: true, message: 'If an account exists and is not verified, a verification email has been sent.' });
    }

    const user = result.rows[0];
    if (user.is_verified) {
      return res.status(400).json({ success: false, message: 'Account is already verified' });
    }

    // Generate new token and expiry
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await query('UPDATE users SET verification_token = $1, verification_expires = $2 WHERE id = $3', [verificationToken, verificationExpires, user.id]);

    // Send verification email
    await sendVerificationEmail(email, user.name || '', verificationToken);

    return res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: 'Error resending verification email' });
  }
};