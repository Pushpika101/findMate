const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT 
        id, email, name, student_id, profile_photo, 
        is_verified, is_admin, created_at,
        (SELECT COUNT(*) FROM items WHERE user_id = $1 AND type = 'lost') as lost_items_count,
        (SELECT COUNT(*) FROM items WHERE user_id = $1 AND type = 'found') as found_items_count,
        (SELECT COUNT(*) FROM items WHERE user_id = $1 AND status = 'resolved') as resolved_items_count
      FROM users 
      WHERE id = $1
    `, [userId]);

    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, student_id } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const result = await query(`
      UPDATE users 
      SET name = $1, student_id = $2
      WHERE id = $3
      RETURNING id, email, name, student_id, profile_photo, is_verified, is_admin
    `, [name, student_id, userId]);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// @desc    Update profile photo
// @route   POST /api/users/profile-photo
// @access  Private
exports.updateProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const photoUrl = req.file.path;

    const result = await query(`
      UPDATE users 
      SET profile_photo = $1
      WHERE id = $2
      RETURNING id, email, name, student_id, profile_photo, is_verified, is_admin
    `, [photoUrl, userId]);

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile photo'
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Get current password
    const userResult = await query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
};

// @desc    Get user's statistics
// @route   GET /api/users/statistics
// @access  Private
exports.getStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE type = 'lost' AND status = 'active') as active_lost,
        COUNT(*) FILTER (WHERE type = 'found' AND status = 'active') as active_found,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) as total_items
      FROM items
      WHERE user_id = $1
    `, [userId]);

    const matchStats = await query(`
      SELECT COUNT(*) as total_matches
      FROM matches m
      JOIN items i ON (i.id = m.lost_item_id OR i.id = m.found_item_id)
      WHERE i.user_id = $1
    `, [userId]);

    res.json({
      success: true,
      data: {
        items: stats.rows[0],
        matches: matchStats.rows[0]
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
};