-- EIIM Database Initialization
-- This script sets up the initial database schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- News Articles Archive
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    summary TEXT, -- AI-generated
    source VARCHAR(100),
    url VARCHAR(500) UNIQUE,
    published_date TIMESTAMP,
    scraped_date TIMESTAMP DEFAULT NOW(),
    category VARCHAR(50),
    tags TEXT[], -- Array of tags
    priority_score INTEGER DEFAULT 0,
    sentiment_score DECIMAL(3,2) DEFAULT 0.0, -- -1 to 1
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily Briefs Archive
CREATE TABLE IF NOT EXISTS daily_briefs (
    id SERIAL PRIMARY KEY,
    brief_date DATE UNIQUE,
    content TEXT, -- Full brief HTML/Markdown
    article_count INTEGER DEFAULT 0,
    top_categories TEXT[],
    generated_at TIMESTAMP DEFAULT NOW(),
    ai_model_used VARCHAR(50), -- Track which model generated
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Carbon Prices Historical
CREATE TABLE IF NOT EXISTS carbon_prices (
    id SERIAL PRIMARY KEY,
    market VARCHAR(50) NOT NULL, -- eu_ets, california, etc.
    price DECIMAL(10,2),
    volume BIGINT,
    currency VARCHAR(3) DEFAULT 'EUR',
    timestamp TIMESTAMP NOT NULL,
    data_source VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ecosystem Metrics Historical
CREATE TABLE IF NOT EXISTS ecosystem_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    value DECIMAL(15,2),
    unit VARCHAR(50),
    period_start DATE,
    period_end DATE,
    geography VARCHAR(50),
    data_source VARCHAR(100),
    recorded_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Data Sources Configuration
CREATE TABLE IF NOT EXISTS data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    source_type VARCHAR(20) NOT NULL, -- 'rss', 'scrape', 'api'
    scrape_frequency INTEGER DEFAULT 3600, -- in seconds
    selector VARCHAR(200), -- CSS selector for scraping
    is_active BOOLEAN DEFAULT true,
    last_scraped TIMESTAMP,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_date_category ON news_articles(published_date, category);
CREATE INDEX IF NOT EXISTS idx_news_fulltext ON news_articles USING gin(to_tsvector('english', title || ' ' || coalesce(content, '')));
CREATE INDEX IF NOT EXISTS idx_carbon_prices_market_timestamp ON carbon_prices(market, timestamp);
CREATE INDEX IF NOT EXISTS idx_carbon_prices_timestamp_desc ON carbon_prices(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_name_period ON ecosystem_metrics(metric_name, period_end);

-- Insert initial data sources
INSERT INTO data_sources (name, url, source_type, scrape_frequency) VALUES
-- Tier 1 - Daily Priority Sources (RSS)
('Environmental Finance', 'https://www.environmental-finance.com/rss', 'rss', 3600),
('Carbon Pulse', 'https://carbon-pulse.com/feed', 'rss', 3600),
('Bloomberg Green', 'https://feeds.bloomberg.com/green', 'rss', 3600),
('ESG Today', 'https://www.esgtoday.com/feed', 'rss', 3600),
('Climate Tech VC', 'https://climatetechvc.substack.com/feed', 'rss', 7200),
('GreenBiz', 'https://www.greenbiz.com/feed', 'rss', 3600),
('Sustainable Finance', 'https://sustainable-finance.hsbc.com/feed', 'rss', 3600),

-- Tier 2 - Weekly Deep Dive Sources (RSS)
('Climate Bonds Initiative', 'https://www.climatebonds.net/feed', 'rss', 7200),
('Ecosystem Marketplace', 'https://www.ecosystemmarketplace.com/feed/', 'rss', 7200),
('Climate Policy Initiative', 'https://climatepolicyinitiative.org/feed/', 'rss', 7200),
('Rocky Mountain Institute', 'https://rmi.org/feed/', 'rss', 7200),
('World Bank Climate', 'https://www.worldbank.org/en/topic/climatechange/rss', 'rss', 7200),
('UNEP Finance Initiative', 'https://www.unepfi.org/feed/', 'rss', 7200),
('Ceres', 'https://www.ceres.org/feed', 'rss', 7200),
('CDP', 'https://www.cdp.net/en/rss', 'rss', 7200),
('Climate Action 100+', 'https://www.climateaction100.org/feed/', 'rss', 7200),
('Task Force on Climate-related Financial Disclosures', 'https://www.fsb-tcfd.org/feed/', 'rss', 7200),
('Network for Greening the Financial System', 'https://www.bis.org/ngfs/rss.xml', 'rss', 7200),
('International Energy Agency', 'https://www.iea.org/rss', 'rss', 7200),
('International Renewable Energy Agency', 'https://www.irena.org/rss', 'rss', 7200),
('Global Sustainable Investment Alliance', 'http://www.gsi-alliance.org/feed/', 'rss', 7200),
('Principles for Responsible Investment', 'https://www.unpri.org/feed', 'rss', 7200),

-- Tier 3 - Monthly Strategic Sources (RSS)
('McKinsey Sustainability', 'https://www.mckinsey.com/capabilities/sustainability/rss', 'rss', 21600),
('Boston Consulting Group Climate', 'https://www.bcg.com/capabilities/climate-change-sustainability/rss', 'rss', 21600),
('Deloitte Sustainability', 'https://www2.deloitte.com/us/en/insights/topics/sustainability.rss', 'rss', 21600),
('PwC Sustainability', 'https://www.pwc.com/gx/en/sustainability/rss.xml', 'rss', 21600),
('KPMG ESG', 'https://home.kpmg/xx/en/home/insights/2020/11/esg-rss.xml', 'rss', 21600),
('Morningstar Sustainable Investing', 'https://www.morningstar.com/rss/sustainable-investing', 'rss', 21600),
('S&P Global Sustainable1', 'https://www.spglobal.com/en/research-insights/topics/sustainable1.rss', 'rss', 21600),
('MSCI ESG Research', 'https://www.msci.com/research-and-insights/esg/rss', 'rss', 21600),
('Refinitiv ESG', 'https://www.refinitiv.com/en/insights/sustainability/rss', 'rss', 21600),
('RepRisk', 'https://www.reprisk.com/feed/', 'rss', 21600),
('Sustainalytics', 'https://www.sustainalytics.com/feed/', 'rss', 21600),
('Climate Trace', 'https://climatetrace.org/feed', 'rss', 21600),
('Climate Central', 'https://www.climatecentral.org/feed', 'rss', 21600),
('Carbon Brief', 'https://www.carbonbrief.org/feed/', 'rss', 21600),
('Inside Climate News', 'https://insideclimatenews.org/feed/', 'rss', 21600),
('Climate Home News', 'https://www.climatechangenews.com/feed/', 'rss', 21600),
('Mongabay', 'https://news.mongabay.com/feed/', 'rss', 21600),
('Yale Environment 360', 'https://e360.yale.edu/feed/', 'rss', 21600),
('The Guardian Environment', 'https://www.theguardian.com/environment/rss', 'rss', 21600),
('Financial Times Climate Capital', 'https://www.ft.com/climate-capital?format=rss', 'rss', 21600),
('Reuters Sustainability', 'https://www.reuters.com/sustainability/rss/', 'rss', 21600),
('Wall Street Journal ESG', 'https://feeds.wsj.com/WSJ/sustainability', 'rss', 21600),
('Axios Climate', 'https://www.axios.com/climate/feed/', 'rss', 21600),
('Politico Energy', 'https://www.politico.com/rss/energy/', 'rss', 21600),
('Climate Wire', 'https://www.climatewire.com/rss/', 'rss', 21600)
ON CONFLICT DO NOTHING;