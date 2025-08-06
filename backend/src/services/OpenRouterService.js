const axios = require('axios');
const { getRedis } = require('../database/connection');
const logger = require('../utils/logger');

class OpenRouterService {
  constructor() {
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.models = {
      summarization: 'anthropic/claude-3-haiku',
      analysis: 'anthropic/claude-3-haiku', // Use haiku for analysis since sonnet is not available
      research: 'anthropic/claude-3-haiku',
      coding: 'deepseek/deepseek-coder',
      alternative: 'meta-llama/llama-3.1-8b-instruct'
    };
    this.rateLimits = {
      requests: 0,
      requestsPerMinute: 20,
      tokens: 0,
      tokensPerMinute: 100000,
      lastReset: Date.now()
    };
  }

  async checkRateLimit() {
    const now = Date.now();
    if (now - this.rateLimits.lastReset > 60000) {
      // Reset counters every minute
      this.rateLimits.requests = 0;
      this.rateLimits.tokens = 0;
      this.rateLimits.lastReset = now;
    }

    if (this.rateLimits.requests >= this.rateLimits.requestsPerMinute) {
      throw new Error('Rate limit exceeded: too many requests per minute');
    }
  }

  async makeRequest(model, messages, options = {}) {
    try {
      await this.checkRateLimit();

      const requestData = {
        model,
        messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        ...options
      };

      logger.info(`Making OpenRouter request to ${model}`);

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://eiim.app',
            'X-Title': 'Environmental Impact Investing Monitor'
          },
          timeout: 30000
        }
      );

      this.rateLimits.requests++;
      this.rateLimits.tokens += response.data.usage?.total_tokens || 0;

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('OpenRouter API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async summarizeArticle(title, content, options = {}) {
    try {
      // Check cache first
      const cacheKey = `summary:${Buffer.from(title + content).toString('base64').slice(0, 32)}`;
      const redis = getRedis();
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        logger.info('Using cached summary');
        return cached;
      }

      const prompt = `Summarize this environmental finance article in exactly 100 words, focusing on investment implications, key metrics, and market impact. Be concise and investor-focused.

Title: ${title}
Content: ${content.slice(0, 2000)}...`; // Limit content length

      const messages = [
        { role: 'user', content: prompt }
      ];

      const summary = await this.makeRequest(
        this.models.summarization,
        messages,
        { maxTokens: 150, temperature: 0.3 }
      );

      // Cache for 24 hours
      await redis.setEx(cacheKey, 86400, summary);

      return summary;
    } catch (error) {
      logger.error('Error summarizing article:', error);
      return this.fallbackSummary(content);
    }
  }

  async generateDailyBrief(articles, options = {}) {
    try {
      if (!articles || articles.length === 0) {
        throw new Error('No articles provided for brief generation');
      }

      const cacheKey = `brief:${new Date().toISOString().split('T')[0]}`;
      const redis = getRedis();
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        logger.info('Using cached daily brief');
        return JSON.parse(cached);
      }

      // Prepare article summaries for the brief
      const articleSummaries = articles.map(article => ({
        title: article.title,
        category: article.category,
        summary: article.summary || article.content?.slice(0, 200),
        priority: article.priority_score || 50,
        source: article.source
      }));

      // Group by category
      const categorizedArticles = this.groupByCategory(articleSummaries);

      const prompt = `Create a comprehensive daily morning brief for environmental impact investors from these ${articles.length} articles.

Structure the brief with:
1. Executive Summary (2-3 sentences highlighting the most important developments)
2. Key Developments by Category
3. Market Implications 
4. Investment Outlook

Focus on:
- Investment opportunities and risks
- Market movements and trends
- Policy changes affecting investments
- Technology breakthroughs with commercial potential
- Regional focus: 60% US/North America, 40% global

Articles by category:
${Object.entries(categorizedArticles).map(([category, items]) => 
  `\n${category.toUpperCase()}:\n${items.map(item => `- ${item.title} (${item.source}): ${item.summary}`).join('\n')}`
).join('\n')}

Keep the brief professional, concise, and actionable for investors.`;

      const messages = [
        { role: 'user', content: prompt }
      ];

      const brief = await this.makeRequest(
        this.models.analysis,
        messages,
        { maxTokens: 1500, temperature: 0.4 }
      );

      const result = {
        content: brief,
        articleCount: articles.length,
        topCategories: Object.keys(categorizedArticles).slice(0, 5),
        generatedAt: new Date(),
        aiModel: this.models.analysis
      };

      // Cache for 6 hours
      await redis.setEx(cacheKey, 21600, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Error generating daily brief:', error);
      return this.fallbackBrief(articles);
    }
  }

  async analyzeTrends(data, dataType = 'carbon_prices', options = {}) {
    try {
      const prompt = this.getTrendAnalysisPrompt(data, dataType);
      
      const messages = [
        { role: 'user', content: prompt }
      ];

      const analysis = await this.makeRequest(
        this.models.analysis,
        messages,
        { maxTokens: 800, temperature: 0.3 }
      );

      return {
        analysis,
        dataType,
        dataPoints: data.length,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error analyzing trends:', error);
      return this.fallbackTrendAnalysis(data, dataType);
    }
  }

  async detectAnomalies(metrics, options = {}) {
    try {
      const prompt = `Review these environmental investment metrics for anomalies or significant changes that warrant investor attention:

${metrics.map(m => `${m.metric_name}: ${m.value} ${m.unit} (${m.period_start} to ${m.period_end})`).join('\n')}

Identify:
1. Unusual patterns or outliers
2. Significant percentage changes
3. Correlation breaks
4. Market disruption signals

Format as brief alerts with severity levels (LOW/MEDIUM/HIGH) and investment implications.`;

      const messages = [
        { role: 'user', content: prompt }
      ];

      const alerts = await this.makeRequest(
        this.models.analysis,
        messages,
        { maxTokens: 500, temperature: 0.2 }
      );

      return this.parseAlerts(alerts);
    } catch (error) {
      logger.error('Error detecting anomalies:', error);
      return [];
    }
  }

  // Helper methods
  groupByCategory(articles) {
    return articles.reduce((acc, article) => {
      const category = article.category || 'general';
      if (!acc[category]) acc[category] = [];
      acc[category].push(article);
      return acc;
    }, {});
  }

  getTrendAnalysisPrompt(data, dataType) {
    if (dataType === 'carbon_prices') {
      return `Analyze this carbon pricing data for trends, patterns, and investment implications:

${data.map(d => `${d.market}: ${d.price} ${d.currency} (${d.timestamp})`).join('\n')}

Include:
- Price movement analysis
- Volatility assessment
- Market correlation insights
- Policy impact evaluation
- Investment recommendations`;
    }
    
    return `Analyze this ${dataType} data for trends and investment implications: ${JSON.stringify(data.slice(0, 10))}`;
  }

  parseAlerts(alertText) {
    // Simple parsing - in production, this would be more sophisticated
    const lines = alertText.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      id: index + 1,
      message: line,
      severity: line.includes('HIGH') ? 'HIGH' : line.includes('MEDIUM') ? 'MEDIUM' : 'LOW',
      timestamp: new Date()
    }));
  }

  fallbackSummary(content) {
    // Simple extractive summary as fallback
    const sentences = content.split('.').filter(s => s.length > 50);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  fallbackBrief(articles) {
    return {
      content: `Daily Brief (${new Date().toDateString()})\n\nCollected ${articles.length} articles from environmental finance sources. Key categories include ${[...new Set(articles.map(a => a.category))].join(', ')}. Detailed analysis unavailable - please check AI service configuration.`,
      articleCount: articles.length,
      topCategories: [...new Set(articles.map(a => a.category))].slice(0, 5),
      generatedAt: new Date(),
      aiModel: 'fallback'
    };
  }

  fallbackTrendAnalysis(data, dataType) {
    return {
      analysis: `Basic trend analysis for ${dataType}: ${data.length} data points analyzed. Detailed AI analysis unavailable - please check API configuration.`,
      dataType,
      dataPoints: data.length,
      generatedAt: new Date()
    };
  }
}

module.exports = OpenRouterService;