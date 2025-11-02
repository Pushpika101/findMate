const { query } = require('../config/database');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT 
        u.id, u.email, u.name, u.student_id, u.profile_photo, 
        u.is_verified, u.is_admin, u.created_at,
        COUNT(DISTINCT i.id) as total_items,
        COUNT(DISTINCT CASE WHEN i.type = 'lost' THEN i.id END) as lost_items,
        COUNT(DISTINCT CASE WHEN i.type = 'found' THEN i.id END) as found_items
      FROM users u
      LEFT JOIN items i ON u.id = i.user_id
    `;

    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      queryText += ` WHERE (LOWER(u.name) LIKE LOWER($${paramCount}) OR LOWER(u.email) LIKE LOWER($${paramCount}))`;
      queryParams.push(`%${search}%`);
    }

    queryText += ` GROUP BY u.id ORDER BY u.created_at DESC`;

    paramCount++;
    queryText += ` LIMIT $${paramCount}`;
    queryParams.push(limit);

    paramCount++;
    queryText += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    const result = await query(queryText, queryParams);

    // Get total count
    const countResult = await query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      count: result.rows.length,
      total,
      data: {
        users: result.rows
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await query(`
      SELECT 
        id, email, name, student_id, profile_photo, 
        is_verified, is_admin, created_at
      FROM users 
      WHERE id = $1
    `, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's items
    const itemsResult = await query(
      'SELECT * FROM items WHERE user_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      success: true,
      data: {
        user: userResult.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details'
    });
  }
};

// @desc    Ban/Suspend user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from banning themselves
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot ban yourself'
      });
    }

    // Delete user (this will cascade delete their items, chats, etc.)
    await query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'User banned successfully'
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error banning user'
    });
  }
};

// @desc    Get all items (admin view)
// @route   GET /api/admin/items
// @access  Private/Admin
exports.getAllItems = async (req, res) => {
  try {
    const { type, status, search, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT i.*, u.name as user_name, u.email as user_email
      FROM items i
      JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 0;

    if (type) {
      paramCount++;
      queryText += ` AND i.type = $${paramCount}`;
      queryParams.push(type);
    }

    if (status) {
      paramCount++;
      queryText += ` AND i.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (LOWER(i.item_name) LIKE LOWER($${paramCount}) OR LOWER(i.description) LIKE LOWER($${paramCount}))`;
      queryParams.push(`%${search}%`);
    }

    queryText += ` ORDER BY i.created_at DESC`;

    paramCount++;
    queryText += ` LIMIT $${paramCount}`;
    queryParams.push(limit);

    paramCount++;
    queryText += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      count: result.rows.length,
      data: {
        items: result.rows
      }
    });
  } catch (error) {
    console.error('Get all items error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching items'
    });
  }
};

// @desc    Delete item (admin)
// @route   DELETE /api/admin/items/:id
// @access  Private/Admin
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM items WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting item'
    });
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/statistics
// @access  Private/Admin
exports.getStatistics = async (req, res) => {
  try {
    // Total users
    const usersResult = await query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Verified users
    const verifiedResult = await query('SELECT COUNT(*) FROM users WHERE is_verified = true');
    const verifiedUsers = parseInt(verifiedResult.rows[0].count);

    // Items statistics
    const itemsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE type = 'lost') as lost,
        COUNT(*) FILTER (WHERE type = 'found') as found,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved
      FROM items
    `);

    // Matches statistics
    const matchesResult = await query('SELECT COUNT(*) FROM matches');
    const totalMatches = parseInt(matchesResult.rows[0].count);

    // Recent activity (last 7 days)
    const activityResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as items_last_week
      FROM items
    `);

    // Most active users
    const activeUsersResult = await query(`
      SELECT u.name, u.email, COUNT(i.id) as item_count
      FROM users u
      JOIN items i ON u.id = i.user_id
      GROUP BY u.id
      ORDER BY item_count DESC
      LIMIT 5
    `);

    // Success rate (resolved items / total items)
    const successRate = itemsResult.rows[0].total > 0
      ? ((itemsResult.rows[0].resolved / itemsResult.rows[0].total) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: totalUsers - verifiedUsers
        },
        items: {
          total: parseInt(itemsResult.rows[0].total),
          lost: parseInt(itemsResult.rows[0].lost),
          found: parseInt(itemsResult.rows[0].found),
          active: parseInt(itemsResult.rows[0].active),
          resolved: parseInt(itemsResult.rows[0].resolved)
        },
        matches: {
          total: totalMatches
        },
        activity: {
          itemsLastWeek: parseInt(activityResult.rows[0].items_last_week)
        },
        successRate: parseFloat(successRate),
        mostActiveUsers: activeUsersResult.rows
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