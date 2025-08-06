const { getDB } = require('../database/connection');
const logger = require('../utils/logger');
const EnhancedPriceCollector = require('../services/EnhancedPriceCollector');
const OpenRouterService = require('../services/OpenRouterService');

// Get current carbon prices
const getCurrentPrices = async (req, res) => {
  try {
    const db = getDB();
    
    // Get latest prices for each market
    const result = await db.query(`
      SELECT DISTINCT ON (market) 
        market, price, volume, currency, timestamp, data_source
      FROM carbon_prices 
      ORDER BY market, timestamp DESC
    `);
    
    // Transform to object format for easier frontend consumption
    const prices = {};
    result.rows.forEach(row => {
      prices[row.market] = {
        current: parseFloat(row.price),
        volume: row.volume,
        currency: row.currency,
        timestamp: row.timestamp,
        source: row.data_source
      };
    });
    
    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    logger.error('Error fetching current carbon prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current prices'
    });
  }
};

// Get historical price data
const getHistoricalPrices = async (req, res) => {
  try {
    const { market, days = 30 } = req.query;
    const db = getDB();
    
    let query = `
      SELECT market, price, volume, currency, timestamp, data_source
      FROM carbon_prices 
      WHERE timestamp >= NOW() - INTERVAL '${days} days'
    `;
    
    let params = [];
    if (market) {
      query += ' AND market = $1';
      params.push(market);
    }
    
    query += ' ORDER BY timestamp DESC';
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching historical carbon prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical prices'
    });
  }
};

// Get trend analysis for carbon prices
const getTrendAnalysis = async (req, res) => {
  try {
    const { market, days = 30 } = req.query;
    const priceCollector = new EnhancedPriceCollector();
    
    if (market) {
      const analysis = await priceCollector.getHistoricalAnalysis(market, days);
      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Insufficient data for trend analysis'
        });
      }
      
      // Get AI-powered analysis if available
      let aiAnalysis = null;
      try {
        const aiService = new OpenRouterService();
        const db = getDB();
        const priceData = await db.query(`
          SELECT market, price, timestamp
          FROM carbon_prices
          WHERE market = $1 AND timestamp >= NOW() - INTERVAL '${days} days'
          ORDER BY timestamp DESC
          LIMIT 50
        `, [market]);
        
        if (priceData.rows.length > 10) {
          aiAnalysis = await aiService.analyzeTrends(priceData.rows, 'carbon_prices');
        }
      } catch (error) {
        logger.warn('AI trend analysis failed:', error.message);
      }
      
      res.json({
        success: true,
        data: {
          statistical: analysis,
          ai_analysis: aiAnalysis
        }
      });
    } else {
      // Get analysis for all markets
      const markets = ['eu_ets', 'california', 'rggi', 'uk_ets'];
      const analyses = {};
      
      for (const marketName of markets) {
        const analysis = await priceCollector.getHistoricalAnalysis(marketName, days);
        if (analysis) {
          analyses[marketName] = analysis;
        }
      }
      
      res.json({
        success: true,
        data: analyses
      });
    }
  } catch (error) {
    logger.error('Error getting trend analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trend analysis'
    });
  }
};

module.exports = {
  getCurrentPrices,
  getHistoricalPrices,
  getTrendAnalysis
};