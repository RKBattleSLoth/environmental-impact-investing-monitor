require('dotenv').config();
const logger = require('../src/utils/logger');
const { getDB } = require('../src/database/connection');
const DailySummaryGenerator = require('./generateDailySummary');

const CREATE_LINK_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS daily_brief_articles (
    id SERIAL PRIMARY KEY,
    brief_id INTEGER REFERENCES daily_briefs(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
    source_rank INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(brief_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_brief_articles_brief_id ON daily_brief_articles(brief_id);
CREATE INDEX IF NOT EXISTS idx_daily_brief_articles_article_id ON daily_brief_articles(article_id);
`;

async function ensureLinkTable(db) {
  await db.query(CREATE_LINK_TABLE_SQL);
}

async function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  logger.info('Starting daily brief regeneration process');

  const generator = new DailySummaryGenerator();

  try {
    await generator.initialize();

    const db = getDB();
    await ensureLinkTable(db);

    const { rows } = await db.query('SELECT DISTINCT brief_date FROM daily_briefs ORDER BY brief_date');
    logger.info(`Found ${rows.length} briefs to regenerate`);

    for (const [index, row] of rows.entries()) {
      const date = new Date(row.brief_date);
      logger.info(`[${index + 1}/${rows.length}] Regenerating brief for ${row.brief_date}`);

      try {
        await generator.generateSummaryForDate(date, { force: true });
      } catch (error) {
        logger.error(`Failed to regenerate brief for ${row.brief_date}:`, error);
      }

      await pause(6000); // respect upstream rate limits
    }

    logger.info('Daily brief regeneration completed successfully');
  } catch (error) {
    logger.error('Daily brief regeneration failed:', error);
    process.exitCode = 1;
  } finally {
    await generator.cleanup();
  }
}

if (require.main === module) {
  main().catch(error => {
    logger.error('Unhandled error during regeneration:', error);
    process.exit(1);
  });
}

module.exports = main;
