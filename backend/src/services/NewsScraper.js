const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const { getDB } = require('../database/connection');
const logger = require('../utils/logger');
const OpenRouterService = require('./OpenRouterService');

class NewsScraper {
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'EIIM/1.0 (+https://eiim.app)'
      }
    });
    this.aiService = new OpenRouterService();
  }

  async scrapeAllSources() {
    const db = getDB();
    let totalArticles = 0;

    try {
      // Get active RSS sources from database
      const sourcesResult = await db.query(`
        SELECT * FROM data_sources 
        WHERE is_active = true AND source_type = 'rss'
        ORDER BY id
      `);

      const sources = sourcesResult.rows;
      logger.info(`Starting to scrape ${sources.length} RSS sources`);

      for (const source of sources) {
        try {
          const articles = await this.scrapeRSSSource(source);
          totalArticles += articles.length;

          // Update last scraped time
          await db.query(`
            UPDATE data_sources 
            SET last_scraped = NOW(), error_count = 0 
            WHERE id = $1
          `, [source.id]);

          logger.info(`Scraped ${articles.length} articles from ${source.name}`);
        } catch (error) {
          logger.error(`Failed to scrape ${source.name}:`, error);

          // Increment error count
          await db.query(`
            UPDATE data_sources 
            SET error_count = error_count + 1 
            WHERE id = $1
          `, [source.id]);
        }
      }

      return { totalArticles };
    } catch (error) {
      logger.error('Error in scrapeAllSources:', error);
      throw error;
    }
  }

  async scrapeRSSSource(source) {
    try {
      const feed = await this.parser.parseURL(source.url);
      const articles = [];

      for (const item of feed.items.slice(0, 10)) { // Limit to 10 most recent
        try {
          const article = await this.processArticle(item, source);
          if (article) {
            articles.push(article);
          }
        } catch (error) {
          logger.error(`Error processing article from ${source.name}:`, error);
        }
      }

      return articles;
    } catch (error) {
      logger.error(`Error scraping RSS source ${source.name}:`, error);
      throw error;
    }
  }

  async processArticle(item, source) {
    const db = getDB();

    try {
      // Check if article already exists
      const existingResult = await db.query(
        'SELECT id FROM news_articles WHERE url = $1',
        [item.link]
      );

      if (existingResult.rows.length > 0) {
        return null; // Article already exists
      }

      // Extract and clean content
      const title = this.cleanText(item.title);
      const content = this.cleanText(item.content || item.summary || '');
      const publishedDate = new Date(item.pubDate || item.isoDate);

      // Categorize article based on title and content
      const category = this.categorizeArticle(title, content);

      // Calculate priority score
      const priorityScore = this.calculatePriorityScore(title, content, source.name);

      // Generate AI summary
      let summary = '';
      try {
        if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'sk-or-v1-demo-key-for-development') {
          summary = await this.aiService.summarizeArticle(title, content);
        }
      } catch (error) {
        logger.warn('Failed to generate AI summary, using fallback:', error.message);
        summary = this.generateFallbackSummary(content);
      }

      // Insert into database with summary
      const result = await db.query(`
        INSERT INTO news_articles (title, content, summary, source, url, published_date, category, priority_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [title, content, summary, source.name, item.link, publishedDate, category, priorityScore]);

      return {
        id: result.rows[0].id,
        title,
        url: item.link,
        source: source.name,
        category
      };
    } catch (error) {
      if (error.code === '23505') { // Duplicate key error
        return null;
      }
      throw error;
    }
  }

  cleanText(text) {
    if (!text) return '';

    // Remove HTML tags
    const $ = cheerio.load(text);
    return $.text().trim();
  }

  categorizeArticle(title, content) {
    const text = (title + ' ' + content).toLowerCase();

    if (text.includes('venture') || text.includes('startup') || text.includes('funding')) {
      return 'venture-capital';
    }
    if (text.includes('carbon') || text.includes('emissions') || text.includes('pricing')) {
      return 'carbon-markets';
    }
    if (text.includes('bond') || text.includes('public market') || text.includes('stock')) {
      return 'public-markets';
    }
    if (text.includes('policy') || text.includes('regulation') || text.includes('government')) {
      return 'policy-regulation';
    }
    if (text.includes('technology') || text.includes('innovation') || text.includes('breakthrough')) {
      return 'technology';
    }
    if (text.includes('biodiversity') || text.includes('nature') || text.includes('ecosystem')) {
      return 'biodiversity';
    }

    return 'esg-sustainability';
  }

  calculatePriorityScore(title, content, source) {
    let score = 50; // Base score

    // Source reputation multiplier
    const highValueSources = ['Environmental Finance', 'Carbon Pulse', 'Bloomberg Green'];
    if (highValueSources.includes(source)) {
      score += 20;
    }

    // Keywords that increase priority
    const highPriorityKeywords = [
      'breakthrough', 'record', 'first', 'largest', 'major', 'significant',
      'investment', 'funding', 'merger', 'acquisition', 'ipo', 'regulation'
    ];

    const text = (title + ' ' + content).toLowerCase();
    highPriorityKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 10;
      }
    });

    return Math.min(100, Math.max(0, score)); // Clamp between 0-100
  }

  generateFallbackSummary(content) {
    if (!content) return '';

    // Simple extractive summary - get first few sentences
    const sentences = content.split('.').filter(s => s.trim().length > 30);
    const summary = sentences.slice(0, 3).join('. ');
    return summary ? summary + '.' : content.slice(0, 200) + '...';
  }

  async generateDailyBrief(date = null) {
    const db = getDB();
    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      // Check if brief already exists for this date
      const existingBrief = await db.query(
        'SELECT id FROM daily_briefs WHERE brief_date = $1',
        [targetDate]
      );

      if (existingBrief.rows.length > 0) {
        logger.info(`Daily brief already exists for ${targetDate}`);
        return existingBrief.rows[0];
      }

      // Get articles from the last 24 hours with summaries
      const articlesResult = await db.query(`
        SELECT id, title, content, summary, source, published_date, category, priority_score
        FROM news_articles 
        WHERE published_date >= $1::date - INTERVAL '24 hours'
          AND published_date < $1::date + INTERVAL '24 hours'
          AND summary IS NOT NULL
        ORDER BY priority_score DESC, published_date DESC
        LIMIT 20
      `, [targetDate]);

      if (articlesResult.rows.length === 0) {
        logger.warn(`No articles found for brief generation on ${targetDate}`);
        return null;
      }

      const articles = articlesResult.rows;
      logger.info(`Generating daily brief from ${articles.length} articles for ${targetDate}`);

      // Generate brief using AI
      let briefData;
      try {
        if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'sk-or-v1-demo-key-for-development') {
          briefData = await this.aiService.generateDailyBrief(articles, { date: targetDate, retryAttempts: 6 });
        } else {
          briefData = this.generateFallbackBrief(articles);
        }
      } catch (error) {
        logger.error('AI brief generation failed, using fallback:', error);
        briefData = this.generateFallbackBrief(articles);
      }

      const summaryPayload = {
        ...briefData.summary,
        generatedAt: briefData.summary.generatedAt || new Date().toISOString()
      };

      // Store in database
      const result = await db.query(`
        INSERT INTO daily_briefs (brief_date, content, article_count, top_categories, ai_model_used)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        targetDate,
        JSON.stringify(summaryPayload),
        briefData.articleCount,
        briefData.topCategories,
        briefData.aiModel || 'fallback'
      ]);

      const briefId = result.rows[0].id;

      // Track article references
      await db.query('DELETE FROM daily_brief_articles WHERE brief_id = $1', [briefId]);
      for (const [index, article] of articles.entries()) {
        await db.query(`
          INSERT INTO daily_brief_articles (brief_id, article_id, source_rank)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [briefId, article.id, index + 1]);
      }

      logger.info(`Daily brief generated successfully for ${targetDate}, ID: ${briefId}`);
      return { id: briefId };

    } catch (error) {
      logger.error('Error generating daily brief:', error);
      throw error;
    }
  }

  generateFallbackBrief(articles) {
    const categories = {};
    articles.forEach(article => {
      const cat = article.category || 'general';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(article);
    });

    const topCategories = Object.keys(categories).slice(0, 5);

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
        executiveSummary: `Today's brief covers ${articles.length} key developments across ${topCategories.length || 'multiple'} categories, highlighting themes such as ${topCategories.join(', ') || 'climate finance and policy momentum'}.`,
        keyDevelopments: developments,
        marketImplications: 'Detailed AI analysis unavailable. Market sentiment remains driven by climate policy, capital inflows to clean technologies, and evolving disclosure standards.',
        investmentOutlook: 'Monitor pipeline strength in carbon markets, clean energy infrastructure, and ESG-aligned corporate actions. Maintain diversified exposure across high-impact climate solutions.',
        sentiment: 'neutral',
        topCategories,
        articleLinks,
        generatedAt: new Date().toISOString()
      },
      articleCount: articles.length,
      topCategories,
      aiModel: 'fallback'
    };
  }
}

module.exports = NewsScraper;