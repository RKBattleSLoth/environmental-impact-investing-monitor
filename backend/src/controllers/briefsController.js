const { getDB } = require('../database/connection');
const logger = require('../utils/logger');

const parseBriefContent = (rawContent) => {
  if (!rawContent) {
    return null;
  }

  if (typeof rawContent === 'object') {
    return rawContent;
  }

  if (typeof rawContent === 'string') {
    try {
      return JSON.parse(rawContent);
    } catch (error) {
      logger.warn('Failed to parse brief content as JSON, returning raw string');
      return rawContent;
    }
  }

  return rawContent;
};

// Get daily briefs with pagination
const getBriefs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 10;
    const offset = (page - 1) * limit;
    const dateFilter = req.query.date;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const db = getDB();

    const conditions = [];
    const values = [];

    if (dateFilter) {
      conditions.push(`brief_date = $${values.length + 1}`);
      values.push(dateFilter);
    } else {
      if (startDate) {
        conditions.push(`brief_date >= $${values.length + 1}`);
        values.push(startDate);
      }

      if (endDate) {
        conditions.push(`brief_date <= $${values.length + 1}`);
        values.push(endDate);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM daily_briefs ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get briefs
    const resultQuery = `
      SELECT id, brief_date, content, article_count, top_categories, generated_at, ai_model_used
      FROM daily_briefs 
      ${whereClause}
      ORDER BY brief_date DESC 
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const result = await db.query(resultQuery, [...values, limit, offset]);

    const data = result.rows.map(row => ({
      ...row,
      content: parseBriefContent(row.content)
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasNext: offset + limit < total
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

    const brief = {
      ...result.rows[0],
      content: parseBriefContent(result.rows[0].content)
    };

    res.json({
      success: true,
      data: brief
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