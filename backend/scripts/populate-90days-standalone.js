require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');
const winston = require('winston');
const Parser = require('rss-parser');
const axios = require('axios');

// Setup logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// RSS Parser
const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['pubDate', 'published_date'],
      ['content:encoded', 'content'],
      ['description', 'description']
    ]
  }
});

// Data sources
const RSS_SOURCES = [
  { name: 'Environmental Finance', url: 'https://www.environmental-finance.com/rss', priority: 10 },
  { name: 'Carbon Pulse', url: 'https://carbon-pulse.com/feed', priority: 10 },
  { name: 'Bloomberg Green', url: 'https://feeds.bloomberg.com/green', priority: 10 },
  { name: 'ESG Today', url: 'https://www.esgtoday.com/feed', priority: 10 },
  { name: 'Climate Tech VC', url: 'https://climatetechvc.substack.com/feed', priority: 10 },
  { name: 'GreenBiz', url: 'https://www.greenbiz.com/feed', priority: 10 },
  { name: 'Sustainable Finance', url: 'https://sustainable-finance.hsbc.com/feed', priority: 10 },
  // Add more sources as needed
];

// AI summarization function
async function generateSummary(articles, date) {
  if (!process.env.OPENROUTER_API_KEY) {
    logger.warn('No OpenRouter API key, skipping AI summary');
    return {
      headline: `Environmental Finance Daily Brief - ${date}`,
      summary: 'AI summarization is not configured. Manual review required.',
      keyStories: articles.slice(0, 3).map(a => a.title),
      sentiment: 'neutral',
      keyTopics: ['Environmental Finance'],
      marketImplications: 'Not analyzed'
    };
  }

  const articlesText = articles.slice(0, 20).map((article, index) => {
    return `Article ${index + 1}:
Title: ${article.title}
Source: ${article.source}
URL: ${article.url}
Published: ${article.published_date}
Content: ${(article.content || article.description || '').substring(0, 1000)}...`;
  }).join('\n\n');

  const prompt = `Create a 400-500 word daily summary of environmental finance news.

Articles:
${articlesText}

Respond with JSON:
{
  "headline": "Catchy headline",
  "summary": "400-500 word summary",
  "keyStories": ["Story 1", "Story 2", "Story 3"],
  "sentiment": "positive/negative/neutral",
  "keyTopics": ["Topic1", "Topic2"],
  "marketImplications": "Brief analysis"
}`;

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'anthropic/claude-3-haiku',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    logger.error('AI summarization failed:', error.message);
    return {
      headline: `Environmental Finance Daily Brief - ${date}`,
      summary: articles.slice(0, 10).map(a => `• ${a.title}`).join('\n'),
      keyStories: articles.slice(0, 3).map(a => a.title),
      sentiment: 'neutral',
      keyTopics: ['Environmental Finance'],
      marketImplications: 'Analysis unavailable'
    };
  }
}

// Main function
async function populate90Days() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting 90-day population...');
    
    // Clear existing daily briefs
    await client.query('DELETE FROM daily_briefs');
    logger.info('Cleared existing daily briefs');
    
    // Get last 90 days
    const dates = [];
    for (let i = 89; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    
    logger.info(`Processing ${dates.length} days...`);
    
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const dateStr = date.toISOString().split('T')[0];
      
      logger.info(`Processing day ${i + 1}/${dates.length}: ${dateStr}`);
      
      // Fetch articles from RSS feeds
      const allArticles = [];
      
      for (const source of RSS_SOURCES) {
        try {
          logger.info(`Fetching from ${source.name}...`);
          const feed = await parser.parseURL(source.url);
          
          const articles = feed.items.map(item => ({
            title: item.title,
            url: item.link,
            content: item.content || item.description || '',
            source: source.name,
            published_date: new Date(item.published_date || item.isoDate || date),
            priority: source.priority
          }));
          
          allArticles.push(...articles);
          logger.info(`Found ${articles.length} articles from ${source.name}`);
          
          // Be respectful to sources
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          logger.error(`Error fetching from ${source.name}:`, error.message);
        }
      }
      
      // Sort by priority and date
      allArticles.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return new Date(b.published_date) - new Date(a.published_date);
      });
      
      // Save articles
      for (const article of allArticles) {
        try {
          // Check if article already exists
          const exists = await client.query(
            'SELECT id FROM news_articles WHERE url = $1',
            [article.url]
          );
          
          if (exists.rows.length === 0) {
            await client.query(`
              INSERT INTO news_articles (
                title, content, source, url, published_date, 
                scraped_date, priority_score
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              article.title,
              article.content,
              article.source,
              article.url,
              article.published_date,
              new Date(),
              article.priority
            ]);
          }
        } catch (error) {
          logger.error(`Error saving article: ${article.url}`, error.message);
        }
      }
      
      // Generate daily summary
      if (allArticles.length > 0) {
        logger.info(`Generating summary for ${dateStr} with ${allArticles.length} articles...`);
        
        const summary = await generateSummary(allArticles, dateStr);
        
        // Save daily brief
        const briefResult = await client.query(`
          INSERT INTO daily_briefs (
            brief_date, content, article_count, top_categories, 
            ai_model_used
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [
          dateStr,
          JSON.stringify({
            ...summary,
            articleSources: allArticles.slice(0, 20).map(a => ({
              title: a.title,
              source: a.source,
              url: a.url,
              published_date: a.published_date
            }))
          }),
          allArticles.length,
          summary.keyTopics,
          'anthropic/claude-3-haiku'
        ]);
        
        const briefId = briefResult.rows[0].id;
        
        // Link articles to brief
        for (let j = 0; j < Math.min(allArticles.length, 20); j++) {
          const article = allArticles[j];
          
          // Get article ID
          const articleResult = await client.query(
            'SELECT id FROM news_articles WHERE url = $1',
            [article.url]
          );
          
          if (articleResult.rows.length > 0) {
            await client.query(`
              INSERT INTO daily_brief_articles (brief_id, article_id, source_rank)
              VALUES ($1, $2, $3)
              ON CONFLICT DO NOTHING
            `, [briefId, articleResult.rows[0].id, j + 1]);
          }
        }
        
        logger.info(`Created daily brief for ${dateStr}`);
      }
      
      // Progress update
      const progress = Math.round(((i + 1) / dates.length) * 100);
      logger.info(`Progress: ${progress}% complete`);
      
      // Small delay between days
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    logger.info('Successfully populated 90 days of data!');
    
  } catch (error) {
    logger.error('Population failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
populate90Days()
  .then(() => {
    logger.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });
