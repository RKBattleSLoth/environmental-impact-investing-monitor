-- Create junction table to track which articles are used in each daily brief
CREATE TABLE IF NOT EXISTS daily_brief_articles (
    id SERIAL PRIMARY KEY,
    brief_id INTEGER REFERENCES daily_briefs(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
    source_rank INTEGER NOT NULL, -- 1 for most important, 2 for second, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(brief_id, article_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_brief_articles_brief_id ON daily_brief_articles(brief_id);
CREATE INDEX IF NOT EXISTS idx_daily_brief_articles_article_id ON daily_brief_articles(article_id);
