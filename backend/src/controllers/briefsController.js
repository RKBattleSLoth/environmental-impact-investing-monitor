const { getDB } = require('../database/connection');
const logger = require('../utils/logger');

// Get daily briefs with pagination
const getBriefs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const db = getDB();
    
    // Get total count
    const countResult = await db.query('SELECT COUNT(*) FROM daily_briefs');
    const total = parseInt(countResult.rows[0].count);
    
    // Get briefs
    const result = await db.query(`
      SELECT id, brief_date, content, article_count, top_categories, generated_at, ai_model_used
      FROM daily_briefs 
      ORDER BY brief_date DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasNext: offset + parseInt(limit) < total
      }
    });
  } catch (error) {
    logger.error('Error fetching briefs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch briefs'
    });
  }
};

// Get specific date brief
const getBriefByDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    const db = getDB();
    const result = await db.query(`
      SELECT id, brief_date, content, article_count, top_categories, generated_at, ai_model_used
      FROM daily_briefs 
      WHERE brief_date = $1
    `, [date]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Brief not found for this date'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error fetching brief by date:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brief'
    });
  }
};

// Create new brief (internal use)
const createBrief = async (req, res) => {
  try {
    const { brief_date, content, article_count, top_categories, ai_model_used } = req.body;
    
    const db = getDB();
    const result = await db.query(`
      INSERT INTO daily_briefs (brief_date, content, article_count, top_categories, ai_model_used)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [brief_date, content, article_count, top_categories, ai_model_used]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error creating brief:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create brief'
    });
  }
};

module.exports = {
  getBriefs,
  getBriefByDate,
  createBrief
};