const { getDB } = require('../database/connection');
const logger = require('../utils/logger');

// Get current ecosystem metrics
const getCurrentMetrics = async (req, res) => {
  try {
    const db = getDB();
    
    // Get latest metrics for each metric name
    const result = await db.query(`
      SELECT DISTINCT ON (metric_name) 
        metric_name, value, unit, period_start, period_end, geography, data_source, recorded_at
      FROM ecosystem_metrics 
      ORDER BY metric_name, recorded_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching current metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current metrics'
    });
  }
};

// Get historical metrics data
const getHistoricalMetrics = async (req, res) => {
  try {
    const { metric_name, days = 90 } = req.query;
    const db = getDB();
    
    let query = `
      SELECT metric_name, value, unit, period_start, period_end, geography, data_source, recorded_at
      FROM ecosystem_metrics 
      WHERE recorded_at >= NOW() - INTERVAL '${days} days'
    `;
    
    let params = [];
    if (metric_name) {
      query += ' AND metric_name = $1';
      params.push(metric_name);
    }
    
    query += ' ORDER BY recorded_at DESC';
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching historical metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical metrics'
    });
  }
};

module.exports = {
  getCurrentMetrics,
  getHistoricalMetrics
};