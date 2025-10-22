require('dotenv').config();
const { connectDB, getDB, closeConnections } = require('../src/database/connection');
const logger = require('../src/utils/logger');
const OpenRouterService = require('../src/services/OpenRouterService');

class DailySummaryGenerator {
  constructor() {
    this.db = null;
    this.openRouter = new OpenRouterService();
  }

  async initialize() {
    const connections = await connectDB();
    this.db = getDB();
    logger.info('Initialized database and AI connections');
  }

  async getArticlesForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Get articles for the date and the day before (for timezone coverage)
    const prevDate = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    
    const result = await this.db.query(`
      SELECT * FROM news_articles 
      WHERE DATE(published_date) IN ($1, $2)
      ORDER BY priority_score DESC, published_date DESC
      LIMIT 50
    `, [dateStr, prevDateStr]);
    
    return result.rows;
  }

  selectTopArticles(articles, maxArticles = 20) {
    // Prioritize by priority score and recency
    return articles
      .sort((a, b) => {
        // First by priority
        if (b.priority_score !== a.priority_score) {
          return b.priority_score - a.priority_score;
        }
        // Then by recency
        return new Date(b.published_date) - new Date(a.published_date);
      })
      .slice(0, maxArticles);
  }

  async generateSummaryForDate(date, options = {}) {
    const dateStr = date.toISOString().split('T')[0];
    logger.info(`Generating daily summary for: ${dateStr}`);
    const { force = false } = options;
    
    try {
      // Check if summary already exists
      const existingResult = await this.db.query(
        'SELECT id FROM daily_briefs WHERE brief_date = $1',
        [dateStr]
      );
      
      let briefId = existingResult.rows.length > 0 ? existingResult.rows[0].id : null;

      if (briefId && !force) {
        logger.info(`Summary already exists for ${dateStr}, skipping`);
        return briefId;
      }
      
      // Get articles for the date
      const articles = await this.getArticlesForDate(date);
      
      if (articles.length === 0) {
        logger.warn(`No articles found for ${dateStr}`);
        return null;
      }
      
      // Select top articles
      const topArticles = this.selectTopArticles(articles);
      logger.info(`Processing ${topArticles.length} articles for summary`);
      let briefData = await this.openRouter.generateDailyBrief(topArticles, {
        date: dateStr,
        retryAttempts: 6
      });

      if (!briefData || !briefData.summary) {
        logger.warn('AI did not return structured summary, using fallback');
        briefData = this.generateFallbackSummary(topArticles);
      }

      const summaryPayload = {
        ...briefData.summary,
        generatedAt: briefData.summary.generatedAt || new Date().toISOString()
      };

      if (briefId) {
        await this.db.query(
          `UPDATE daily_briefs
             SET content = $1,
                 article_count = $2,
                 top_categories = $3,
                 ai_model_used = $4,
                 updated_at = NOW()
           WHERE id = $5`,
          [
            JSON.stringify(summaryPayload),
            briefData.articleCount,
            briefData.topCategories,
            briefData.aiModel || process.env.AI_MODEL_ANALYSIS || 'anthropic/claude-3-haiku',
            briefId
          ]
        );
        await this.db.query('DELETE FROM daily_brief_articles WHERE brief_id = $1', [briefId]);
      } else {
        const insertResult = await this.db.query(`
          INSERT INTO daily_briefs (
            brief_date, content, article_count, top_categories,
            ai_model_used, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          dateStr,
          JSON.stringify(summaryPayload),
          briefData.articleCount,
          briefData.topCategories,
          briefData.aiModel || process.env.AI_MODEL_ANALYSIS || 'anthropic/claude-3-haiku',
          new Date(),
          new Date()
        ]);
        briefId = insertResult.rows[0].id;
      }

      // Store article references
      for (const [index, article] of topArticles.entries()) {
        await this.db.query(`
          INSERT INTO daily_brief_articles (brief_id, article_id, source_rank)
          VALUES ($1, $2, $3)
          ON CONFLICT (brief_id, article_id) DO UPDATE SET source_rank = EXCLUDED.source_rank
        `, [
          briefId,
          article.id,
          index + 1
        ]);
      }

      logger.info(`Successfully generated daily summary for ${dateStr}`);
      return briefId;
      
    } catch (error) {
      logger.error(`Error generating summary for ${dateStr}:`, error);
      throw error;
    }
  }

  async generateSummariesForDateRange(startDate, endDate, options = {}) {
    const summaries = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      try {
        const summaryId = await this.generateSummaryForDate(new Date(currentDate), options);
        if (summaryId) {
          summaries.push({
            date: currentDate.toISOString().split('T')[0],
            summaryId
          });
        }
      } catch (error) {
        logger.error(`Failed to generate summary for ${currentDate}:`, error);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    return summaries;
  }

  async cleanup() {
    await closeConnections();
  }
}

// Run if called directly
if (require.main === module) {
  // Get date from command line or use today
  const targetDate = process.argv[2] ? new Date(process.argv[2]) : new Date();
  
  const generator = new DailySummaryGenerator();
  
  generator.initialize()
    .then(() => {
      if (process.argv[2] && process.argv[3]) {
        // Date range provided
        return generator.generateSummariesForDateRange(
          new Date(process.argv[2]),
          new Date(process.argv[3])
        );
      } else {
        // Single date provided
        return generator.generateSummaryForDate(targetDate);
      }
    })
    .then(() => {
      logger.info('Daily summary generation completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Script failed:', error);
      process.exit(1);
    });
}

DailySummaryGenerator.prototype.generateFallbackSummary = function (articles) {
  const categories = {};
  articles.forEach(article => {
    const category = article.category || 'general';
    categories[category] = categories[category] || [];
    categories[category].push(article);
  });

  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .map(([category]) => category);

  const articleLinks = articles.map((article, index) => ({
    rank: index + 1,
    title: article.title,
    source: article.source,
    url: article.url,
    publishedAt: article.published_date
  }));

  const developments = Object.entries(categories).flatMap(([category, grouped]) =>
    grouped.slice(0, 3).map(article => ({
      title: article.title,
      detail: (article.summary || article.content || '').slice(0, 280),
      category
    }))
  ).slice(0, 6);

  return {
    summary: {
      headline: `Daily Environmental Impact Investing Brief — ${new Date().toDateString()}`,
      executiveSummary: `Today's brief covers ${articles.length} notable developments spanning ${topCategories.length || 'multiple'} categories, including ${topCategories.join(', ') || 'core climate finance themes'}.`,
      keyDevelopments: developments,
      marketImplications: 'Detailed AI analysis unavailable. Track ongoing policy shifts, financing trends, and technology breakthroughs shaping environmental markets.',
      investmentOutlook: 'Maintain diversified exposure across climate opportunities while monitoring regulatory momentum and investor sentiment.',
      sentiment: 'neutral',
      topCategories,
      articleLinks,
      generatedAt: new Date().toISOString()
    },
    articleCount: articles.length,
    topCategories,
    aiModel: 'fallback'
  };
};

module.exports = DailySummaryGenerator;
