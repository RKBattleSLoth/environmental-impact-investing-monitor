require('dotenv').config();
const { connectDB, getDB, closeConnections } = require('../src/database/connection');
const logger = require('../src/utils/logger');
const NewsScraper = require('../src/services/NewsScraper');

class Fetch90Days {
  constructor() {
    this.db = null;
    this.newsScraper = new NewsScraper();
    this.articlesByDate = new Map();
  }

  async initialize() {
    const connections = await connectDB();
    this.db = getDB();
    logger.info('Initialized database connection');
  }

  getDateRange(days = 90) {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }
    
    return dates.reverse(); // Start from oldest to newest
  }

  async fetchArticlesForDate(targetDate) {
    const dateStr = targetDate.toISOString().split('T')[0];
    logger.info(`Fetching articles for date: ${dateStr}`);
    
    try {
      // Get active RSS sources
      const sourcesResult = await this.db.query(
        'SELECT * FROM data_sources WHERE source_type = $1 AND is_active = true',
        ['rss']
      );
      
      let totalArticles = 0;
      const articlesForDate = [];
      
      // Fetch from each source
      for (const source of sourcesResult.rows) {
        try {
          logger.info(`Fetching from source: ${source.name}`);
          const articles = await this.newsScraper.fetchFromRSS(source.url);
          
          // Filter articles for the target date or nearby dates
          const filteredArticles = articles.filter(article => {
            if (!article.published_date) return false;
            
            const articleDate = new Date(article.published_date);
            const articleDateStr = articleDate.toISOString().split('T')[0];
            
            // Include articles from target date or day before (for time zone differences)
            return articleDateStr === dateStr || 
                   articleDateStr === new Date(targetDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          });
          
          // Process each article
          for (const article of filteredArticles) {
            try {
              // Check if article already exists
              const existingResult = await this.db.query(
                'SELECT id FROM news_articles WHERE url = $1',
                [article.url]
              );
              
              if (existingResult.rows.length === 0) {
                // Insert new article
                const insertResult = await this.db.query(`
                  INSERT INTO news_articles (
                    title, content, source, url, published_date, 
                    scraped_date, category, tags, priority_score
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                  RETURNING id
                `, [
                  article.title,
                  article.content || '',
                  article.source || source.name,
                  article.url,
                  article.published_date,
                  new Date(),
                  article.category || 'general',
                  article.tags || [],
                  this.getPriorityScore(source.name)
                ]);
                
                articlesForDate.push({
                  id: insertResult.rows[0].id,
                  ...article
                });
              } else {
                articlesForDate.push({
                  id: existingResult.rows[0].id,
                  ...article
                });
              }
            } catch (err) {
              logger.error(`Error processing article: ${article.url}`, err);
            }
          }
          
          totalArticles += filteredArticles.length;
          logger.info(`Found ${filteredArticles.length} articles from ${source.name}`);
          
          // Small delay to be respectful to sources
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (err) {
          logger.error(`Error fetching from ${source.name}:`, err);
        }
      }
      
      this.articlesByDate.set(dateStr, articlesForDate);
      logger.info(`Total articles collected for ${dateStr}: ${articlesForDate.length}`);
      
      return articlesForDate;
    } catch (error) {
      logger.error(`Error fetching articles for ${dateStr}:`, error);
      return [];
    }
  }

  getPriorityScore(sourceName) {
    // Assign priority scores based on source importance
    const tier1Sources = [
      'Environmental Finance', 'Carbon Pulse', 'Bloomberg Green', 
      'ESG Today', 'Climate Tech VC', 'GreenBiz', 'Sustainable Finance'
    ];
    
    const tier2Sources = [
      'Climate Bonds Initiative', 'Ecosystem Marketplace', 'Climate Policy Initiative',
      'Rocky Mountain Institute', 'World Bank Climate', 'UNEP Finance Initiative'
    ];
    
    if (tier1Sources.includes(sourceName)) return 10;
    if (tier2Sources.includes(sourceName)) return 7;
    return 5; // Default score for other sources
  }

  async fetchAllDays(days = 90) {
    const dates = this.getDateRange(days);
    logger.info(`Starting to fetch articles for ${dates.length} days`);
    
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      logger.info(`Processing day ${i + 1}/${dates.length}`);
      
      await this.fetchArticlesForDate(date);
      
      // Progress update
      const progress = Math.round(((i + 1) / dates.length) * 100);
      logger.info(`Progress: ${progress}% complete`);
      
      // Small delay between days
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    logger.info('Completed fetching articles for all days');
    return this.articlesByDate;
  }

  async cleanup() {
    await closeConnections();
  }
}

// Run if called directly
if (require.main === module) {
  const fetcher = new Fetch90Days();
  
  fetcher.initialize()
    .then(() => fetcher.fetchAllDays(90))
    .then(() => {
      logger.info('Fetch 90 days script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = Fetch90Days;
