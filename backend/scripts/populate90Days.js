require('dotenv').config();
const logger = require('../src/utils/logger');
const { clearDailySummaries } = require('./clearDailySummaries');
const Fetch90Days = require('./fetch90Days');
const DailySummaryGenerator = require('./generateDailySummary');

class Populate90Days {
  constructor() {
    this.startDate = null;
    this.endDate = null;
  }

  async run() {
    const startTime = Date.now();
    
    try {
      logger.info('=' .repeat(60));
      logger.info('Starting 90-Day Database Population Process');
      logger.info('=' .repeat(60));
      
      // Step 1: Clear existing data
      logger.info('\n🗑️  Step 1: Clearing existing daily summaries...');
      await clearDailySummaries();
      logger.info('✅ Step 1 completed\n');
      
      // Step 2: Fetch articles for last 90 days
      logger.info('📰 Step 2: Fetching articles for the last 90 days...');
      const fetcher = new Fetch90Days();
      await fetcher.initialize();
      
      const articlesByDate = await fetcher.fetchAllDays(90);
      await fetcher.cleanup();
      
      logger.info(`✅ Step 2 completed - fetched articles for ${articlesByDate.size} days\n`);
      
      // Step 3: Generate daily summaries
      logger.info('🤖 Step 3: Generating AI-powered daily summaries...');
      const generator = new DailySummaryGenerator();
      await generator.initialize();
      
      // Calculate date range
      this.endDate = new Date();
      this.startDate = new Date();
      this.startDate.setDate(this.startDate.getDate() - 90);
      
      const summaries = await generator.generateSummariesForDateRange(
        this.startDate,
        this.endDate
      );
      
      await generator.cleanup();
      
      logger.info(`✅ Step 3 completed - generated ${summaries.length} daily summaries\n`);
      
      // Final report
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000 / 60);
      
      logger.info('=' .repeat(60));
      logger.info('🎉 POPULATION COMPLETED SUCCESSFULLY');
      logger.info('=' .repeat(60));
      logger.info(`⏱️  Total time: ${duration} minutes`);
      logger.info(`📅 Date range: ${this.startDate.toISOString().split('T')[0]} to ${this.endDate.toISOString().split('T')[0]}`);
      logger.info(`📰 Days processed: ${articlesByDate.size}`);
      logger.info(`📝 Summaries generated: ${summaries.length}`);
      logger.info(`📊 Average articles per day: ${Math.round(Array.from(articlesByDate.values()).reduce((sum, articles) => sum + articles.length, 0) / articlesByDate.size)}`);
      logger.info('\n✨ Database is now ready with 90 days of environmental finance coverage!');
      
    } catch (error) {
      logger.error('❌ Population process failed:', error);
      throw error;
    }
  }

  async resume() {
    // Find the last successfully processed date
    logger.info('Checking for existing data to resume from...');
    
    // Implementation for resume functionality can be added here
    logger.info('Resume functionality not yet implemented, running full process');
    return this.run();
  }
}

// Command line interface
async function main() {
  const command = process.argv[2];
  
  try {
    const populator = new Populate90Days();
    
    switch (command) {
      case 'resume':
        await populator.resume();
        break;
      default:
        await populator.run();
        break;
    }
    
    logger.info('\n🚀 Process completed successfully');
    process.exit(0);
    
  } catch (error) {
    logger.error('\n💥 Process failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = Populate90Days;
