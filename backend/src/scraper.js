require('dotenv').config();
const cron = require('node-cron');
const { connectDB } = require('./database/connection');
const logger = require('./utils/logger');
const NewsScraper = require('./services/NewsScraper');
const EnhancedPriceCollector = require('./services/EnhancedPriceCollector');
const MetricsCollector = require('./services/MetricsCollector');

class ScraperService {
  constructor() {
    this.newsScraper = new NewsScraper();
    this.priceCollector = new EnhancedPriceCollector();
    this.metricsCollector = new MetricsCollector();
    this.isRunning = false;
  }

  async start() {
    try {
      // Connect to database
      await connectDB();
      logger.info('Scraper service connected to database');

      // Schedule news scraping every hour
      cron.schedule('0 * * * *', async () => {
        if (!this.isRunning) {
          logger.info('Starting scheduled news scraping...');
          await this.runNewsScraping();
        }
      });

      // Schedule carbon price collection every 15 minutes during market hours
      cron.schedule('*/15 * * * *', async () => {
        if (!this.isRunning) {
          logger.info('Starting scheduled price collection...');
          await this.runPriceCollection();
        }
      });

      // Schedule daily brief generation at 7 AM
      cron.schedule('0 7 * * *', async () => {
        logger.info('Starting daily brief generation...');
        await this.generateDailyBrief();
      });

      // Schedule metrics collection daily at 8 AM
      cron.schedule('0 8 * * *', async () => {
        logger.info('Starting metrics collection...');
        await this.collectMetrics();
      });

      // Initial run
      logger.info('Scraper service started successfully');
      await this.runInitialCollection();

    } catch (error) {
      logger.error('Failed to start scraper service:', error);
      process.exit(1);
    }
  }

  async runInitialCollection() {
    logger.info('Running initial data collection...');
    await this.runNewsScraping();
    await this.runPriceCollection();
  }

  async runNewsScraping() {
    try {
      this.isRunning = true;
      const results = await this.newsScraper.scrapeAllSources();
      logger.info(`News scraping completed: ${results.totalArticles} articles collected`);
    } catch (error) {
      logger.error('News scraping failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async runPriceCollection() {
    try {
      this.isRunning = true;
      const results = await this.priceCollector.collectAllPrices();
      logger.info(`Price collection completed: ${results.totalPrices} prices collected`);
    } catch (error) {
      logger.error('Price collection failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async generateDailyBrief() {
    try {
      const result = await this.newsScraper.generateDailyBrief();
      if (result) {
        logger.info(`Daily brief generation completed, ID: ${result.id}`);
      } else {
        logger.warn('No articles available for brief generation');
      }
    } catch (error) {
      logger.error('Daily brief generation failed:', error);
    }
  }

  async collectMetrics() {
    try {
      const results = await this.metricsCollector.collectAllMetrics();
      logger.info(`Metrics collection completed: ${results.totalCollected} metrics collected`);
    } catch (error) {
      logger.error('Metrics collection failed:', error);
    }
  }
}

// Start the scraper service
if (require.main === module) {
  const scraperService = new ScraperService();
  scraperService.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('Scraper service shutting down...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('Scraper service shutting down...');
    process.exit(0);
  });
}

module.exports = ScraperService;