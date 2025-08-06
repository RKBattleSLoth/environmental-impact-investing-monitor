# Environmental Impact Investing Monitor (EIIM)

A comprehensive web application that aggregates news from 47+ sources, tracks multiple carbon pricing streams with historical analysis, monitors 18 key ecosystem metrics, and provides AI-powered insights for environmental impact investors.

## 🚀 Features

- **Daily News Briefings**: AI-powered summaries from 47+ environmental finance sources
- **Carbon Price Tracking**: Real-time monitoring of major carbon markets (EU ETS, California, RGGI, UK ETS)
- **Ecosystem Metrics Dashboard**: 18 key environmental investment indicators
- **Historical Analysis**: 2+ years of data retention with trend analysis
- **Archive System**: Searchable database of all briefs and articles
- **AI Integration**: OpenRouter API for content summarization and analysis

## 🛠 Technology Stack

**Backend:**
- Node.js with Express.js
- PostgreSQL database
- Redis for caching
- Cheerio for web scraping
- OpenRouter API for AI processing

**Frontend:**
- React 18+ with TypeScript
- Tailwind CSS
- Chart.js for data visualization
- React Query for state management

**Infrastructure:**
- Docker & Docker Compose
- Nginx reverse proxy
- GitHub Actions CI/CD

## 🏃‍♂️ Quick Start

### Prerequisites

- Docker and Docker Compose
- Git
- OpenRouter API key

### Setup

1. **Clone and setup environment:**
   ```bash
   git clone <repository-url>
   cd river_road
   make setup
   ```

2. **Configure environment variables:**
   Edit `.env` file with your API keys:
   ```bash
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

3. **Start the application:**
   ```bash
   make up
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

## 📋 Development Commands

```bash
# Core commands
make up          # Start all services
make down        # Stop all services
make logs        # View all logs
make build       # Build containers

# Development
make test        # Run tests
make lint        # Run linting
make install     # Install dependencies

# Database
make db-init     # Initialize database
make db-reset    # Reset database (DANGER)

# Debugging
make shell-backend   # Access backend container
make shell-frontend  # Access frontend container
make shell-db        # Access database
```

## 📊 API Endpoints

### Core Endpoints
```
GET  /api/v1/briefs                 # Get daily briefs
GET  /api/v1/briefs/:date          # Get specific date brief
GET  /api/v1/carbon-prices         # Current carbon prices
GET  /api/v1/carbon-prices/historical # Historical price data
GET  /api/v1/metrics               # Current ecosystem metrics
GET  /api/v1/metrics/historical    # Historical metrics data
GET  /api/v1/search                # Search archived content
POST /api/v1/alerts                # Create alerts
```

### Health Check
```
GET /health                        # Service health status
```

## 🗄 Database Schema

### Key Tables
- `news_articles` - Article archive with AI summaries
- `daily_briefs` - Generated daily briefings
- `carbon_prices` - Historical carbon pricing data
- `ecosystem_metrics` - Environmental metrics tracking
- `data_sources` - News source configuration

## 🤖 AI Integration

The application uses OpenRouter API for:
- **Content Summarization**: 500-word articles → 100-word summaries
- **Brief Generation**: Daily briefings from top 15-20 articles
- **Trend Analysis**: Pattern identification in historical data
- **Sentiment Analysis**: Market sentiment from news content
- **Anomaly Detection**: Unusual price movements or metric changes

### Models Used
- **Default**: `anthropic/claude-3-haiku` (cost-effective)
- **Analysis**: `anthropic/claude-3-sonnet` (complex tasks)
- **Research**: `anthropic/claude-3-opus` (deep analysis)

## 📈 Data Sources

### Tier 1 - Daily Priority (RSS)
- Environmental Finance
- Carbon Pulse
- Bloomberg Green
- ESG Today
- Climate Tech VC
- GreenBiz
- Sustainable Finance

### Tier 2 - Weekly Deep Dive (15 sources)
Including Climate Bonds Initiative, Ecosystem Marketplace, World Bank Climate, etc.

### Tier 3 - Monthly Strategic (25 sources)
Major consulting firms, research organizations, and policy institutions.

## 🔒 Security & Privacy

- Environment variables for all sensitive data
- Separate keys for development/production
- No personal user data collection initially
- GDPR-compliant data handling procedures
- HTTPS-only data transmission
- Request throttling and rate limiting

## 🚀 Deployment

### Development
```bash
make up
```

### Production
```bash
make build-prod
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 Success Metrics

### Technical KPIs
- 99%+ uptime for data collection
- <3 second page load times
- <5 minute brief generation time
- 100% API test coverage

### Business KPIs
- >70% daily brief engagement rate
- Archive search usage growth
- 2+ years historical data retention
- Zero data loss incidents

## 🐛 Troubleshooting

### Common Issues

1. **Services won't start:**
   ```bash
   make clean
   make build
   make up
   ```

2. **Database connection issues:**
   ```bash
   make db-reset
   ```

3. **View service logs:**
   ```bash
   make logs-backend
   make logs-frontend
   make logs-db
   ```

4. **Reset everything:**
   ```bash
   make clean
   make setup
   make up
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test`
5. Run linting: `make lint`
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. View logs: `make logs`
3. Create an issue in the repository

---

**Built with ❤️ for environmental impact investors**