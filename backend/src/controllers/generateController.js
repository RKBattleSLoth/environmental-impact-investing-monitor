const { getDB } = require('../database/connection');
const logger = require('../utils/logger');
const NewsScraper = require('../services/NewsScraper');
const { Parser } = require('@json2csv/plainjs');

// Generate daily brief on demand
const generateBrief = async (req, res) => {
  try {
    const { date, force = false } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const newsScraper = new NewsScraper();
    
    // Check if brief already exists unless force is true
    if (!force) {
      const db = getDB();
      const existing = await db.query(
        'SELECT * FROM daily_briefs WHERE brief_date = $1',
        [targetDate]
      );
      
      if (existing.rows.length > 0) {
        return res.json({
          success: true,
          data: existing.rows[0],
          message: 'Brief already exists for this date'
        });
      }
    }
    
    const result = await newsScraper.generateDailyBrief(targetDate);
    
    if (result) {
      res.json({
        success: true,
        data: result,
        message: 'Brief generated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No articles available for brief generation'
      });
    }
  } catch (error) {
    logger.error('Error generating brief on demand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate brief'
    });
  }
};

// Export data in various formats
const exportData = async (req, res) => {
  try {
    const { 
      type = 'articles', // articles, briefs, prices, metrics
      format = 'json', // json, csv, pdf
      date_from,
      date_to,
      category,
      limit = 1000
    } = req.query;
    
    const db = getDB();
    let data = [];
    let filename = '';
    
    // Get data based on type
    switch (type) {
      case 'articles':
        const articleQuery = `
          SELECT id, title, summary, source, published_date, category, priority_score, url
          FROM news_articles
          WHERE ($1::text IS NULL OR category = $1)
            AND ($2::date IS NULL OR published_date >= $2)
            AND ($3::date IS NULL OR published_date <= $3)
          ORDER BY published_date DESC
          LIMIT $4
        `;
        const articleResult = await db.query(articleQuery, [category, date_from, date_to, limit]);
        data = articleResult.rows;
        filename = `eiim_articles_${Date.now()}`;
        break;
        
      case 'briefs':
        const briefQuery = `
          SELECT id, brief_date, article_count, top_categories, generated_at, ai_model_used
          FROM daily_briefs
          WHERE ($1::date IS NULL OR brief_date >= $1)
            AND ($2::date IS NULL OR brief_date <= $2)
          ORDER BY brief_date DESC
          LIMIT $3
        `;
        const briefResult = await db.query(briefQuery, [date_from, date_to, limit]);
        data = briefResult.rows;
        filename = `eiim_briefs_${Date.now()}`;
        break;
        
      case 'prices':
        const priceQuery = `
          SELECT market, price, volume, currency, timestamp, data_source
          FROM carbon_prices
          WHERE ($1::date IS NULL OR timestamp >= $1)
            AND ($2::date IS NULL OR timestamp <= $2)
          ORDER BY timestamp DESC
          LIMIT $3
        `;
        const priceResult = await db.query(priceQuery, [date_from, date_to, limit]);
        data = priceResult.rows;
        filename = `eiim_carbon_prices_${Date.now()}`;
        break;
        
      case 'metrics':
        const metricQuery = `
          SELECT metric_name, value, unit, period_start, period_end, geography, data_source, recorded_at
          FROM ecosystem_metrics
          WHERE ($1::date IS NULL OR recorded_at >= $1)
            AND ($2::date IS NULL OR recorded_at <= $2)
          ORDER BY recorded_at DESC
          LIMIT $3
        `;
        const metricResult = await db.query(metricQuery, [date_from, date_to, limit]);
        data = metricResult.rows;
        filename = `eiim_metrics_${Date.now()}`;
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid export type'
        });
    }
    
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found for export'
      });
    }
    
    // Format data based on requested format
    switch (format) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        res.json({
          success: true,
          export_info: {
            type,
            format,
            count: data.length,
            generated_at: new Date().toISOString()
          },
          data
        });
        break;
        
      case 'csv':
        try {
          // Flatten nested objects for CSV export
          const flattenedData = data.map(row => {
            const flattened = {};
            Object.keys(row).forEach(key => {
              if (Array.isArray(row[key])) {
                flattened[key] = row[key].join('; ');
              } else if (typeof row[key] === 'object' && row[key] !== null) {
                flattened[key] = JSON.stringify(row[key]);
              } else {
                flattened[key] = row[key];
              }
            });
            return flattened;
          });
          
          const parser = new Parser();
          const csv = parser.parse(flattenedData);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
          res.send(csv);
        } catch (error) {
          logger.error('CSV export error:', error);
          res.status(500).json({
            success: false,
            error: 'Failed to generate CSV export'
          });
        }
        break;
        
      case 'pdf':
        // PDF export would require additional libraries like puppeteer or pdfkit
        res.status(501).json({
          success: false,
          error: 'PDF export not yet implemented'
        });
        break;
        
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid export format'
        });
    }
  } catch (error) {
    logger.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
};

module.exports = {
  generateBrief,
  exportData
};