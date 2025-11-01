const { query } = require('../config/database');
const { findMatches } = require('../services/matchingService');
const { notifyAllUsers, createNotification } = require('../services/notificationService');
const { deleteImage } = require('../config/cloudinary');

// @desc    Get all items with filters
// @route   GET /api/items
// @access  Private
exports.getItems = async (req, res) => {
  try {
    const {
      type,
      category,
      color,
      location,
      date_from,
      date_to,
      status,
      search,
      sort,
      limit = 50,
      offset = 0
    } = req.query;

    let queryText = `
      SELECT i.*, u.name as user_name, u.profile_photo as user_photo
      FROM items i
      JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    // Apply filters
    if (type) {
      paramCount++;
      queryText += ` AND i.type = $${paramCount}`;
      queryParams.push(type);
    }

    if (category) {
      paramCount++;
      queryText += ` AND i.category = $${paramCount}`;
      queryParams.push(category);
    }

    if (color) {
      paramCount++;
      queryText += ` AND i.color = $${paramCount}`;
      queryParams.push(color);
    }

    if (location) {
      paramCount++;
      queryText += ` AND LOWER(i.location) LIKE LOWER($${paramCount})`;
      queryParams.push(`%${location}%`);
    }

    if (date_from) {
      paramCount++;
      queryText += ` AND i.date >= $${paramCount}`;
      queryParams.push(date_from);
    }

    if (date_to) {
      paramCount++;
      queryText += ` AND i.date <= $${paramCount}`;
      queryParams.push(date_to);
    }

    if (status) {
      paramCount++;
      queryText += ` AND i.status = $${paramCount}`;
      queryParams.push(status);
    } else {
      // Default to active items only
      queryText += ` AND i.status = 'active'`;
    }

    // Search in item name and description
    if (search) {
      paramCount++;
      queryText += ` AND (LOWER(i.item_name) LIKE LOWER($${paramCount}) OR LOWER(i.description) LIKE LOWER($${paramCount}))`;
      queryParams.push(`%${search}%`);
    }

    // Sorting
    const sortOptions = {
      'recent': 'i.created_at DESC',
      'oldest': 'i.created_at ASC',
      'date_desc': 'i.date DESC',
      'date_asc': 'i.date ASC'
    };
    const sortBy = sortOptions[sort] || 'i.created_at DESC';
    queryText += ` ORDER BY ${sortBy}`;

    // Pagination
    paramCount++;
    queryText += ` LIMIT $${paramCount}`;
    queryParams.push(limit);
    
    paramCount++;
    queryText += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    const result = await query(queryText, queryParams);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM items i WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 0;

    if (type) {
      countParamIndex++;
      countQuery += ` AND i.type = $${countParamIndex}`;
      countParams.push(type);
    }
    if (status) {
      countParamIndex++;
      countQuery += ` AND i.status = $${countParamIndex}`;
      countParams.push(status);
    } else {
      countQuery += ` AND i.status = 'active'`;
    }

    const countResult = await query(countQuery, countParams);
    const totalItems = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      count: result.rows.length,
      total: totalItems,
      data: {
        items: result.rows
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching items'
    });
  }
};

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Private
exports.getItem = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT i.*, u.name as user_name, u.email as user_email, u.profile_photo as user_photo, u.student_id
      FROM items i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: {
        item: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching item'
    });
  }
};

// @desc    Create new item
// @route   POST /api/items
// @access  Private
exports.createItem = async (req, res) => {
  try {
    const { type, item_name, category, color, brand, location, date, time, description } = req.body;
    const userId = req.user.id;
    const io = req.app.get('io');

    // Validate required fields
    if (!type || !item_name || !category || !color || !location || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Get uploaded images
    const photo1_url = req.files?.photo1 ? req.files.photo1[0].path : null;
    const photo2_url = req.files?.photo2 ? req.files.photo2[0].path : null;

    // Create item
    const result = await query(`
      INSERT INTO items (user_id, type, item_name, category, color, brand, location, date, time, description, photo1_url, photo2_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [userId, type, item_name, category, color, brand, location, date, time, description, photo1_url, photo2_url]);

    const newItem = result.rows[0];

    // Find matches
    const matches = await findMatches(newItem, io);

    // Notify all users about new item
    await notifyAllUsers(
      'new_item',
      `New ${type} item posted`,
      `${item_name} was reported ${type} at ${location}`,
      newItem.id,
      userId,
      io
    );

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: {
        item: newItem,
        matches: matches.length
      }
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating item'
    });
  }
};

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, category, color, brand, location, date, time, description } = req.body;
    const userId = req.user.id;

    // Check if item exists and belongs to user
    const itemCheck = await query(
      'SELECT * FROM items WHERE id = $1',
      [id]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (itemCheck.rows[0].user_id !== userId && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this item'
      });
    }

    // Handle image updates
    let photo1_url = itemCheck.rows[0].photo1_url;
    let photo2_url = itemCheck.rows[0].photo2_url;

    if (req.files?.photo1) {
      // Delete old photo if exists
      if (photo1_url) {
        const publicId = photo1_url.split('/').slice(-2).join('/').split('.')[0];
        await deleteImage(publicId);
      }
      photo1_url = req.files.photo1[0].path;
    }

    if (req.files?.photo2) {
      if (photo2_url) {
        const publicId = photo2_url.split('/').slice(-2).join('/').split('.')[0];
        await deleteImage(publicId);
      }
      photo2_url = req.files.photo2[0].path;
    }

    // Update item
    const result = await query(`
      UPDATE items 
      SET item_name = $1, category = $2, color = $3, brand = $4, 
          location = $5, date = $6, time = $7, description = $8,
          photo1_url = $9, photo2_url = $10
      WHERE id = $11
      RETURNING *
    `, [item_name, category, color, brand, location, date, time, description, photo1_url, photo2_url, id]);

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: {
        item: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating item'
    });
  }
};

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if item exists and belongs to user
    const itemCheck = await query(
      'SELECT * FROM items WHERE id = $1',
      [id]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (itemCheck.rows[0].user_id !== userId && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this item'
      });
    }

    const item = itemCheck.rows[0];

    // Delete images from Cloudinary
    if (item.photo1_url) {
      const publicId = item.photo1_url.split('/').slice(-2).join('/').split('.')[0];
      await deleteImage(publicId);
    }
    if (item.photo2_url) {
      const publicId = item.photo2_url.split('/').slice(-2).join('/').split('.')[0];
      await deleteImage(publicId);
    }

    // Delete item (cascade will delete related records)
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

// @desc    Get user's items
// @route   GET /api/items/my-items
// @access  Private
exports.getMyItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, status } = req.query;

    let queryText = 'SELECT * FROM items WHERE user_id = $1';
    const queryParams = [userId];
    let paramCount = 1;

    if (type) {
      paramCount++;
      queryText += ` AND type = $${paramCount}`;
      queryParams.push(type);
    }

    if (status) {
      paramCount++;
      queryText += ` AND status = $${paramCount}`;
      queryParams.push(status);
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      count: result.rows.length,
      data: {
        items: result.rows
      }
    });
  } catch (error) {
    console.error('Get my items error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching items'
    });
  }
};

// @desc    Mark item as found/claimed
// @route   POST /api/items/:id/claim
// @access  Private
exports.claimItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const io = req.app.get('io');

    // Get item details
    const itemResult = await query(
      'SELECT * FROM items WHERE id = $1',
      [id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const item = itemResult.rows[0];

    // Send notification to item owner
    const notificationMessage = item.type === 'lost' 
      ? `Someone found your lost item: ${item.item_name}`
      : `Someone claims your found item: ${item.item_name}`;

    await createNotification(
      item.user_id,
      'item_claimed',
      'Item Claim Notification',
      notificationMessage,
      item.id,
      io
    );

    // Create or get chat between users
    const chatResult = await query(`
      INSERT INTO chats (item_id, user1_id, user2_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (item_id, user1_id, user2_id) DO UPDATE
      SET item_id = $1
      RETURNING id
    `, [id, item.user_id, userId]);

    const chatId = chatResult.rows[0].id;

    res.json({
      success: true,
      message: 'Notification sent to item owner',
      data: {
        chatId
      }
    });
  } catch (error) {
    console.error('Claim item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error claiming item'
    });
  }
};

// @desc    Mark item as resolved
// @route   PUT /api/items/:id/resolve
// @access  Private
exports.resolveItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if item belongs to user
    const itemCheck = await query(
      'SELECT * FROM items WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found or unauthorized'
      });
    }

    // Update status to resolved
    const result = await query(`
      UPDATE items 
      SET status = 'resolved'
      WHERE id = $1
      RETURNING *
    `, [id]);

    res.json({
      success: true,
      message: 'Item marked as resolved',
      data: {
        item: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Resolve item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving item'
    });
  }
};

// @desc    Generate share link for item
// @route   GET /api/items/:id/share
// @access  Private
exports.getShareLink = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify item exists
    const itemCheck = await query('SELECT id FROM items WHERE id = $1', [id]);

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const shareLink = `${process.env.CLIENT_URL_WEB}/items/${id}`;

    res.json({
      success: true,
      data: {
        shareLink
      }
    });
  } catch (error) {
    console.error('Get share link error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating share link'
    });
  }
};