const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const result = await query(
        'SELECT id, email, name, student_id, profile_photo, is_verified, is_admin FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Add user to request object
      req.user = result.rows[0];
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check if user is verified
const checkVerified = (req, res, next) => {
  if (!req.user.is_verified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address first'
    });
  }
  next();
};

// Check if user is admin
const checkAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// Validate campus email
// Validate campus email
const validateCampusEmail = (req, res, next) => {
  const { email } = req.body;
  
  // Allow multiple domains
  const allowedDomains = [
    'pdn.ac.lk',
    'eng.pdn.ac.lk',
    'agri.pdn.ac.lk',
    'sci.pdn.ac.lk',
    'med.pdn.ac.lk',
    'dent.pdn.ac.lk',
    'vet.pdn.ac.lk',
    'arts.pdn.ac.lk'
  ];

  const isValidDomain = allowedDomains.some(domain => email.endsWith(`@${domain}`));

  if (!isValidDomain) {
    return res.status(400).json({
      success: false,
      message: `Only University of Peradeniya email addresses are allowed (e.g., @eng.pdn.ac.lk, @pdn.ac.lk)`
    });
  }

  next();
};

module.exports = {
  protect,
  checkVerified,
  checkAdmin,
  validateCampusEmail
};