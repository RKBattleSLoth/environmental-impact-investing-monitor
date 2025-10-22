// Load environment variables
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Debug: check if DATABASE_URL is loaded
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { connectDB, getDB, closeConnections } = require('../src/database/connection');
const logger = require('../src/utils/logger');

async function clearDailySummaries() {
  let db;
  
  try {
    // Connect to database
    const connections = await connectDB();
    db = getDB();
    
    logger.info('Starting to clear existing daily summaries...');
    
    // Count records before deletion
    const countResult = await db.query('SELECT COUNT(*) FROM daily_briefs');
    const count = parseInt(countResult.rows[0].count);
    
    if (count === 0) {
      logger.info('No daily summaries found in database');
      return;
    }
    
    logger.info(`Found ${count} daily summaries to delete`);
    
    // Delete all daily briefs
    const deleteResult = await db.query('DELETE FROM daily_briefs');
    
    logger.info(`Successfully deleted ${deleteResult.rowCount} daily summaries`);
    
    // Optionally, clean up orphaned news articles (those not used in any brief)
    // For now, we'll keep them as they might be useful for future briefs
    
    logger.info('Database cleanup completed successfully');
    
  } catch (error) {
    logger.error('Error clearing daily summaries:', error);
    throw error;
  } finally {
    await closeConnections();
  }
}

// Run if called directly
if (require.main === module) {
  clearDailySummaries()
    .then(() => {
      logger.info('Clear daily summaries script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { clearDailySummaries };
