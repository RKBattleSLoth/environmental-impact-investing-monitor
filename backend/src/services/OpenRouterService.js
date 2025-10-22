const axios = require('axios');
const http = require('http');
const https = require('https');
const { getRedis } = require('../database/connection');
const logger = require('../utils/logger');

class OpenRouterService {
  constructor() {
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.apiKey = process.env.OPENROUTER_API_KEY;
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured. Set OPENROUTER_API_KEY in the environment.');
    }
    const defaultSummarizationModel = process.env.AI_MODEL_DEFAULT || 'anthropic/claude-3-haiku';
    const defaultAnalysisModel = process.env.AI_MODEL_ANALYSIS || 'anthropic/claude-3-haiku';

    this.models = {
      summarization: defaultSummarizationModel,
      analysis: defaultAnalysisModel,
      research: defaultAnalysisModel,
      coding: 'deepseek/deepseek-coder',
      alternative: process.env.AI_MODEL_ALTERNATIVE || 'meta-llama/llama-3.1-8b-instruct'
    };
    this.rateLimits = {
      requests: 0,
      requestsPerMinute: 20,
      tokens: 0,
      tokensPerMinute: 100000,
      lastReset: Date.now()
    };

    const agentOptions = {
      keepAlive: true,
      family: 4
    };

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 45000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://eiim.app',
        'X-Title': 'Environmental Impact Investing Monitor'
      },
      httpAgent: new http.Agent(agentOptions),
      httpsAgent: new https.Agent(agentOptions)
    });
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

      const response = await this.client.post('/chat/completions', requestData);

      this.rateLimits.requests++;
      this.rateLimits.tokens += response.data.usage?.total_tokens || 0;

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('OpenRouter API error:', error.response?.data || { message: error.message, code: error.code });
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
    const { date, useCache = false, retryAttempts = 5 } = options;

    if (!articles || articles.length === 0) {
      throw new Error('No articles provided for brief generation');
    }

    const topCategories = this.extractTopCategories(articles);
    const articleLinks = this.buildArticleLinks(articles);

    let cacheKey;
    let redis;
    if (useCache) {
      redis = getRedis();
      cacheKey = `brief:${date || new Date().toISOString().split('T')[0]}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info('Using cached daily brief');
        return JSON.parse(cached);
      }
    }

    const categorizedArticles = this.groupByCategory(articles.map(article => ({
      title: article.title,
      category: article.category,
      summary: article.summary || article.content?.slice(0, 300),
      priority: article.priority_score || 50,
      source: article.source
    })));

    const prompt = `You are preparing a structured briefing for environmental impact investors based on ${articles.length} articles. Return strict JSON matching:
{
  "headline": string,
  "executiveSummary": string (3-4 sentences),
  "keyDevelopments": [
    {
      "title": string,
      "detail": string (2 sentences focused on investment impact),
      "category": string
    }
  ],
  "marketImplications": string (2 paragraphs),
  "investmentOutlook": string (2 paragraphs),
  "sentiment": "positive" | "neutral" | "negative"
}

Focus on the most material themes across these categories and articles:
${Object.entries(categorizedArticles).map(([category, items]) => `\n${category.toUpperCase()}:\n${items.map(item => `- ${item.title} (${item.source}): ${item.summary || 'No summary provided'}`).join('\n')}`).join('\n')}`;

    const messages = [{ role: 'user', content: prompt }];

    let attempt = 0;
    let lastError;
    while (attempt < retryAttempts) {
      try {
        const response = await this.makeRequest(
          this.models.analysis,
          messages,
          { maxTokens: 1800, temperature: 0.4 }
        );

        const structured = this.parseBriefResponse(response);
        if (!structured) {
          throw new Error('Unable to parse AI brief response');
        }

        const normalized = this.normalizeBriefStructure(structured, {
          topCategories,
          articleLinks
        });

        const result = {
          summary: normalized,
          articleCount: articles.length,
          topCategories,
          aiModel: this.models.analysis
        };

        if (useCache && redis && cacheKey) {
          await redis.setEx(cacheKey, 21600, JSON.stringify(result));
        }

        return result;
      } catch (error) {
        lastError = error;
        attempt += 1;

        if (!this.shouldRetry(error) || attempt >= retryAttempts) {
          logger.error('Error generating daily brief:', error);
          return this.fallbackBrief(articles, { topCategories, articleLinks });
        }

        const delay = Math.min(15000, 2000 * attempt ** 2);
        logger.warn(`Retrying brief generation (attempt ${attempt}/${retryAttempts}) after ${delay}ms due to ${error.response?.status || error.code || error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    logger.error('Failed to generate brief after retries:', lastError);
    return this.fallbackBrief(articles, { topCategories, articleLinks });
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

  shouldRetry(error) {
    const status = error?.response?.status || error?.response?.data?.error?.code;
    const code = error?.code;
    return status === 429 || code === 'ETIMEDOUT' || code === 'ENETUNREACH';
  }

  parseBriefResponse(raw) {
    if (!raw) return null;
    const trimmed = raw.trim();

    const attemptParse = (value) => {
      try {
        return JSON.parse(value);
      } catch (err) {
        return null;
      }
    };

    if (trimmed.startsWith('{')) {
      const parsed = attemptParse(trimmed);
      if (parsed) {
        return parsed;
      }
    }

    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return attemptParse(match[0]);
    }

    return null;
  }

  normalizeBriefStructure(structured, { topCategories, articleLinks }) {
    const developments = Array.isArray(structured?.keyDevelopments)
      ? structured.keyDevelopments
          .filter(item => item && (item.title || item.detail))
          .map(item => ({
            title: (item.title || '').toString().trim(),
            detail: (item.detail || '').toString().trim(),
            category: (item.category || 'general').toString().trim()
          }))
      : [];

    return {
      headline: (structured?.headline || 'Daily Environmental Impact Investing Brief').toString().trim(),
      executiveSummary: (structured?.executiveSummary || '').toString().trim(),
      keyDevelopments: developments.slice(0, 6),
      marketImplications: (structured?.marketImplications || '').toString().trim(),
      investmentOutlook: (structured?.investmentOutlook || '').toString().trim(),
      sentiment: (structured?.sentiment || 'neutral').toString().trim().toLowerCase(),
      topCategories,
      articleLinks,
      generatedAt: new Date().toISOString()
    };
  }

  extractTopCategories(articles, limit = 5) {
    const counts = articles.reduce((acc, article) => {
      const category = (article.category || 'general').toLowerCase();
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([category]) => category);
  }

  buildArticleLinks(articles) {
    return articles.map((article, index) => ({
      rank: index + 1,
      title: article.title,
      source: article.source,
      url: article.url,
      publishedAt: article.published_date
    }));
  }

  fallbackSummary(content) {
    // Simple extractive summary as fallback
    const sentences = content.split('.').filter(s => s.length > 50);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  fallbackBrief(articles, { topCategories, articleLinks }) {
    const categoriesSummary = topCategories.length > 0 ? topCategories.join(', ') : 'core climate finance themes';
    const developments = articles.slice(0, 6).map(article => ({
      title: article.title,
      detail: (article.summary || article.content || '').slice(0, 280),
      category: (article.category || 'general').toLowerCase()
    }));

    return {
      summary: {
        headline: `Daily Environmental Impact Investing Brief — ${new Date().toDateString()}`,
        executiveSummary: `We tracked ${articles.length} notable developments across ${topCategories.length || 'several'} categories in environmental finance, with emphasis on ${categoriesSummary}.`,
        keyDevelopments: developments,
        marketImplications: 'Detailed AI analysis unavailable. Key market themes include continued momentum in climate-aligned capital flows, evolving policy frameworks, and innovation in low-carbon technologies.',
        investmentOutlook: 'Investors should monitor regulatory progress, financing pipelines, and company-level climate commitments. Diversified exposure across high-impact climate sectors remains prudent.',
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