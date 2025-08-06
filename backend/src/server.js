require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const { connectDB } = require('./database/connection');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');
const { requestLogger, healthCheck, errorTracker, metricsCollector, getMetrics, resetMetrics } = require('./middleware/monitoring');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://127.0.0.1:3000', 'http://127.0.0.1:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging and monitoring
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(requestLogger);
app.use(metricsCollector);

// Health check endpoint (enhanced with monitoring)
app.use('/health', healthCheck);
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    ...req.healthData
  });
});

// Monitoring endpoints
app.get('/metrics', getMetrics);
app.post('/metrics/reset', resetMetrics);

// API routes
app.use('/api/v1', routes);

// Error handling middleware
app.use(notFound);
app.use(errorTracker);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed.');
    
    // Close database connections
    // Add database cleanup here
    
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
}

let server;

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Database connected successfully');
    
    // Start server
    server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 EIIM Backend server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
    
    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;