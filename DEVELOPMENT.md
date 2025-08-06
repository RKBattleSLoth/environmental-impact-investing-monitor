# EIIM Development Guide

## Sprint 1 Foundation - Complete! ✅

We've successfully implemented the foundational components for the Environmental Impact Investing Monitor (EIIM):

### ✅ Completed Components

**Infrastructure:**
- ✅ Docker containerized development environment
- ✅ PostgreSQL database with initialization scripts
- ✅ Redis caching layer
- ✅ Multi-service architecture (frontend, backend, scraper, database)

**Backend API:**
- ✅ Express.js server with health checks
- ✅ Core API routes: `/briefs`, `/carbon-prices`, `/metrics`, `/search`
- ✅ Database connection with PostgreSQL
- ✅ Comprehensive error handling and logging
- ✅ Rate limiting and security middleware

**Frontend Application:**
- ✅ React 18+ with TypeScript support
- ✅ Tailwind CSS styling with custom theme
- ✅ Complete routing with React Router
- ✅ All main pages: Dashboard, Briefs, Carbon Prices, Metrics, Archive
- ✅ Responsive layout with mobile-first design
- ✅ Chart.js integration for data visualization

**Data Collection:**
- ✅ News scraping service with RSS parser
- ✅ Carbon price collection with mock data
- ✅ Scheduled tasks with node-cron
- ✅ Basic archive storage and retrieval

**Database Schema:**
- ✅ News articles table with full-text search
- ✅ Daily briefs archive
- ✅ Carbon prices historical data
- ✅ Ecosystem metrics tracking
- ✅ Data sources configuration

## Quick Start

1. **Start the development environment:**
   ```bash
   make up
   ```

2. **View the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

3. **View logs:**
   ```bash
   make logs
   ```

## Project Structure

```
river_road/
├── docker-compose.yml          # Development services
├── Makefile                    # Development commands
├── README.md                   # Project documentation
│
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── controllers/        # API route handlers
│   │   ├── routes/            # Express routes
│   │   ├── services/          # Business logic (scraper, prices)
│   │   ├── middleware/        # Express middleware
│   │   ├── database/          # DB connection & schemas
│   │   └── utils/             # Logging & utilities
│   └── database/init/         # SQL initialization scripts
│
└── frontend/                   # React application
    ├── src/
    │   ├── components/        # Reusable components
    │   ├── pages/             # Page components
    │   ├── styles/            # CSS styles
    │   └── services/          # API calls
    └── public/                # Static assets
```

## API Endpoints

All endpoints are available at `http://localhost:3001/api/v1/`:

- `GET /briefs` - Daily briefs with pagination
- `GET /briefs/:date` - Specific date brief
- `GET /carbon-prices` - Current carbon prices
- `GET /carbon-prices/historical` - Historical price data
- `GET /metrics` - Current ecosystem metrics
- `GET /metrics/historical` - Historical metrics
- `GET /search` - Search archived content

## Development Commands

```bash
# Core operations
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
make shell-db        # Access database shell
```

## Data Flow

1. **News Scraping**: RSS feeds → Article extraction → Database storage
2. **Price Collection**: External APIs → Price normalization → Historical storage  
3. **Brief Generation**: Scheduled AI processing → Daily brief creation
4. **Frontend Display**: API consumption → React components → User interface

## Next Steps (Sprint 3-4)

To complete the MVP, implement:

1. **OpenRouter AI Integration**:
   - Article summarization
   - Daily brief generation
   - Trend analysis

2. **Enhanced Data Collection**:
   - Expand to 47+ news sources
   - Real carbon price APIs
   - Ecosystem metrics collection

3. **Advanced Features**:
   - Full-text search
   - Historical trend analysis
   - Export functionality

## Testing

The foundation is ready for testing:

1. **Start services**: `make up`
2. **Check health**: `curl http://localhost:3001/health`
3. **View frontend**: Open http://localhost:3000
4. **Test APIs**: Use the endpoints listed above

## Troubleshooting

**Services won't start:**
```bash
make clean
make build 
make up
```

**Database issues:**
```bash
make db-reset
```

**View specific logs:**
```bash
make logs-backend
make logs-frontend  
make logs-db
```

## Architecture Highlights

- **Microservices**: Separate containers for web, API, scraper, database
- **Scalable**: Ready for horizontal scaling with load balancers
- **Resilient**: Health checks, graceful shutdowns, error recovery
- **Secure**: Rate limiting, CORS, environment variables
- **Observable**: Comprehensive logging and monitoring hooks

The foundation is solid and ready for Sprint 3-4 feature development! 🚀