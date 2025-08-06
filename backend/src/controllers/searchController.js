const { getDB } = require('../database/connection');
const logger = require('../utils/logger');

// Search archived content with advanced features
const searchContent = async (req, res) => {
  try {
    const { 
      q: query, 
      category, 
      date_from, 
      date_to, 
      type = 'all',
      source,
      priority_min,
      priority_max,
      sort = 'relevance', // relevance, date, priority
      page = 1, 
      limit = 20,
      include_sentiment = false,
      include_summary = true
    } = req.query;
    
    if (!query || query.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 3 characters long'
      });
    }
    
    const offset = (page - 1) * limit;
    const db = getDB();
    
    let results = [];
    
    // Enhanced article search with full-text search and advanced filtering
    if (type === 'all' || type === 'articles') {
      let articleQuery = `
        SELECT 'article' as type, id, title, 
               ${include_summary ? 'summary,' : ''} 
               content, published_date as date, 
               category, source, url, priority_score,
               ${include_sentiment ? 'sentiment_score,' : ''}
               ts_rank(to_tsvector('english', title || ' ' || coalesce(content, '')), plainto_tsquery('english', $1)) as relevance_score
        FROM news_articles 
        WHERE (
          to_tsvector('english', title || ' ' || coalesce(content, '')) @@ plainto_tsquery('english', $1)
          OR title ILIKE $2 OR content ILIKE $2 OR summary ILIKE $2
        )
      `;
      
      let params = [query, `%${query}%`];
      let paramCount = 2;
      
      if (category) {
        paramCount++;
        articleQuery += ` AND category = $${paramCount}`;
        params.push(category);
      }
      
      if (source) {
        paramCount++;
        articleQuery += ` AND source ILIKE $${paramCount}`;
        params.push(`%${source}%`);
      }
      
      if (priority_min) {
        paramCount++;
        articleQuery += ` AND priority_score >= $${paramCount}`;
        params.push(parseInt(priority_min));
      }
      
      if (priority_max) {
        paramCount++;
        articleQuery += ` AND priority_score <= $${paramCount}`;
        params.push(parseInt(priority_max));
      }
      
      if (date_from) {
        paramCount++;
        articleQuery += ` AND published_date >= $${paramCount}`;
        params.push(date_from);
      }
      
      if (date_to) {
        paramCount++;
        articleQuery += ` AND published_date <= $${paramCount}`;
        params.push(date_to);
      }
      
      // Add sorting
      switch (sort) {
        case 'relevance':
          articleQuery += ' ORDER BY relevance_score DESC, priority_score DESC';
          break;
        case 'date':
          articleQuery += ' ORDER BY published_date DESC';
          break;
        case 'priority':
          articleQuery += ' ORDER BY priority_score DESC, published_date DESC';
          break;
        default:
          articleQuery += ' ORDER BY relevance_score DESC, published_date DESC';
      }
      
      const articleResult = await db.query(articleQuery, params);
      results = results.concat(articleResult.rows);
    }
    
    // Search briefs if type is 'all' or 'briefs'
    if (type === 'all' || type === 'briefs') {
      let briefQuery = `
        SELECT 'brief' as type, id, 
               'Daily Brief - ' || brief_date::text as title,
               content, brief_date as date, 'daily-brief' as category,
               'EIIM' as source, null as url, article_count as priority_score
        FROM daily_briefs 
        WHERE content ILIKE $1
      `;
      
      let params = [`%${query}%`];
      let paramCount = 1;
      
      if (date_from) {
        paramCount++;
        briefQuery += ` AND brief_date >= $${paramCount}`;
        params.push(date_from);
      }
      
      if (date_to) {
        paramCount++;
        briefQuery += ` AND brief_date <= $${paramCount}`;
        params.push(date_to);
      }
      
      briefQuery += ' ORDER BY brief_date DESC';
      
      const briefResult = await db.query(briefQuery, params);
      results = results.concat(briefResult.rows);
    }
    
    // Sort combined results by date
    results.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Apply pagination
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasNext: offset + parseInt(limit) < total
      }
    });
  } catch (error) {
    logger.error('Error searching content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search content'
    });
  }
};

module.exports = {
  searchContent
};