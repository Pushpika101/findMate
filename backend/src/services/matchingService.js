const { query } = require('../config/database');
const { createNotification } = require('./notificationService');

// Find matching items for a newly added item
const findMatches = async (newItem, io) => {
  try {
    const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';
    const dateRangeDays = parseInt(process.env.MATCH_DATE_RANGE_DAYS) || 3;
    const matchThreshold = parseInt(process.env.MATCH_THRESHOLD_SCORE) || 80;

    // Calculate date range
    const itemDate = new Date(newItem.date);
    const startDate = new Date(itemDate);
    startDate.setDate(startDate.getDate() - dateRangeDays);
    const endDate = new Date(itemDate);
    endDate.setDate(endDate.getDate() + dateRangeDays);

    // Query for potential matches
    const potentialMatches = await query(`
      SELECT i.*, u.name as user_name, u.email as user_email
      FROM items i
      JOIN users u ON i.user_id = u.id
      WHERE i.type = $1 
      AND i.status = 'active'
      AND i.category = $2
      AND i.color = $3
      AND i.date BETWEEN $4 AND $5
      AND i.user_id != $6
    `, [
      oppositeType,
      newItem.category,
      newItem.color,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      newItem.user_id
    ]);

    const matches = [];

    for (const item of potentialMatches.rows) {
      const matchScore = calculateMatchScore(newItem, item);

      if (matchScore >= matchThreshold) {
        // Save match to database
        await query(`
          INSERT INTO matches (lost_item_id, found_item_id, match_score, notified)
          VALUES ($1, $2, $3, $4)
        `, [
          newItem.type === 'lost' ? newItem.id : item.id,
          newItem.type === 'found' ? newItem.id : item.id,
          matchScore,
          true
        ]);

        matches.push({
          item,
          score: matchScore
        });

        // Send notification to the matched item owner
        await createNotification(
          item.user_id,
          'match_found',
          'Possible Match Found!',
          `We found a potential match for your ${item.type} item: ${item.item_name}`,
          newItem.id,
          io
        );

        // Send notification to the new item owner
        await createNotification(
          newItem.user_id,
          'match_found',
          'Possible Match Found!',
          `Your ${newItem.type} item might match with: ${item.item_name}`,
          item.id,
          io
        );
      }
    }

    return matches;
  } catch (error) {
    console.error('Error finding matches:', error);
    throw error;
  }
};

// Calculate match score between two items
const calculateMatchScore = (item1, item2) => {
  let score = 0;

  // Category match (Required - 40 points)
  if (item1.category === item2.category) {
    score += 40;
  }

  // Color match (Required - 40 points)
  if (item1.color === item2.color) {
    score += 40;
  }

  // Date proximity (0-10 points based on how close the dates are)
  const date1 = new Date(item1.date);
  const date2 = new Date(item2.date);
  const daysDiff = Math.abs((date1 - date2) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    score += 10; // Same day
  } else if (daysDiff <= 1) {
    score += 8; // Within 1 day
  } else if (daysDiff <= 2) {
    score += 5; // Within 2 days
  } else if (daysDiff <= 3) {
    score += 3; // Within 3 days
  }

  // Location similarity (0-10 points)
  if (item1.location && item2.location) {
    const loc1 = item1.location.toLowerCase().trim();
    const loc2 = item2.location.toLowerCase().trim();
    
    if (loc1 === loc2) {
      score += 10; // Exact match
    } else if (loc1.includes(loc2) || loc2.includes(loc1)) {
      score += 7; // Partial match
    }
  }

  // Brand match (0-10 points) - Bonus
  if (item1.brand && item2.brand) {
    const brand1 = item1.brand.toLowerCase().trim();
    const brand2 = item2.brand.toLowerCase().trim();
    
    if (brand1 === brand2) {
      score += 10; // Exact brand match
    } else if (brand1.includes(brand2) || brand2.includes(brand1)) {
      score += 5; // Partial brand match
    }
  }

  return score;
};

// Get matches for a specific item
const getItemMatches = async (itemId, userId) => {
  try {
    const itemResult = await query(
      'SELECT * FROM items WHERE id = $1 AND user_id = $2',
      [itemId, userId]
    );

    if (itemResult.rows.length === 0) {
      throw new Error('Item not found or unauthorized');
    }

    const item = itemResult.rows[0];
    const matchField = item.type === 'lost' ? 'lost_item_id' : 'found_item_id';
    const oppositeField = item.type === 'lost' ? 'found_item_id' : 'lost_item_id';

    const matches = await query(`
      SELECT 
        m.id as match_id,
        m.match_score,
        m.created_at as matched_at,
        i.*,
        u.name as user_name,
        u.email as user_email
      FROM matches m
      JOIN items i ON i.id = m.${oppositeField}
      JOIN users u ON i.user_id = u.id
      WHERE m.${matchField} = $1
      ORDER BY m.match_score DESC, m.created_at DESC
    `, [itemId]);

    return matches.rows;
  } catch (error) {
    console.error('Error getting item matches:', error);
    throw error;
  }
};

// Get all matches for a user
const getUserMatches = async (userId) => {
  try {
    const matches = await query(`
      SELECT 
        m.id as match_id,
        m.match_score,
        m.created_at as matched_at,
        li.id as lost_item_id,
        li.item_name as lost_item_name,
        li.photo1_url as lost_photo,
        fi.id as found_item_id,
        fi.item_name as found_item_name,
        fi.photo1_url as found_photo,
        CASE 
          WHEN li.user_id = $1 THEN 'lost'
          ELSE 'found'
        END as my_item_type,
        CASE 
          WHEN li.user_id = $1 THEN fi.user_id
          ELSE li.user_id
        END as other_user_id,
        u.name as other_user_name
      FROM matches m
      JOIN items li ON li.id = m.lost_item_id
      JOIN items fi ON fi.id = m.found_item_id
      JOIN users u ON u.id = CASE 
        WHEN li.user_id = $1 THEN fi.user_id
        ELSE li.user_id
      END
      WHERE li.user_id = $1 OR fi.user_id = $1
      ORDER BY m.created_at DESC
    `, [userId]);

    return matches.rows;
  } catch (error) {
    console.error('Error getting user matches:', error);
    throw error;
  }
};

module.exports = {
  findMatches,
  calculateMatchScore,
  getItemMatches,
  getUserMatches
};