const logger = require('../utils/logger');

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(body) {
    const duration = Date.now() - start;
    
    // Log request details
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      contentLength: res.get('Content-Length') || body?.length || 0
    });
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow Request', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        status: res.statusCode
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Health check middleware
const healthCheck = (req, res, next) => {
  // Add health check data to request context
  req.healthData = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };
  next();
};

// Error tracking middleware
const errorTracker = (err, req, res, next) => {
  // Log error with context
  logger.error('Application Error', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query
    },
    user: req.user?.id || 'anonymous'
  });
  
  // Track error metrics
  if (global.errorMetrics) {
    global.errorMetrics.total++;
    global.errorMetrics.by_type[err.name] = (global.errorMetrics.by_type[err.name] || 0) + 1;
    global.errorMetrics.last_error = new Date().toISOString();
  }
  
  next(err);
};

// API performance metrics
let apiMetrics = {
  requests: {
    total: 0,
    by_method: {},
    by_status: {},
    by_endpoint: {}
  },
  response_times: {
    avg: 0,
    min: Infinity,
    max: 0,
    total: 0
  },
  errors: {
    total: 0,
    by_type: {},
    last_error: null
  }
};

const metricsCollector = (req, res, next) => {
  const start = Date.now();
  
  // Increment request counters
  apiMetrics.requests.total++;
  apiMetrics.requests.by_method[req.method] = (apiMetrics.requests.by_method[req.method] || 0) + 1;
  
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    
    // Update response time metrics
    apiMetrics.response_times.total += duration;
    apiMetrics.response_times.avg = apiMetrics.response_times.total / apiMetrics.requests.total;
    apiMetrics.response_times.min = Math.min(apiMetrics.response_times.min, duration);
    apiMetrics.response_times.max = Math.max(apiMetrics.response_times.max, duration);
    
    // Track status codes
    apiMetrics.requests.by_status[res.statusCode] = (apiMetrics.requests.by_status[res.statusCode] || 0) + 1;
    
    // Track endpoints
    const endpoint = req.route?.path || req.originalUrl;
    apiMetrics.requests.by_endpoint[endpoint] = (apiMetrics.requests.by_endpoint[endpoint] || 0) + 1;
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Expose metrics endpoint
const getMetrics = (req, res) => {
  res.json({
    success: true,
    data: {
      ...apiMetrics,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu_usage: process.cpuUsage(),
        node_version: process.version,
        platform: process.platform
      },
      timestamp: new Date().toISOString()
    }
  });
};

// Reset metrics (for testing)
const resetMetrics = (req, res) => {
  apiMetrics = {
    requests: {
      total: 0,
      by_method: {},
      by_status: {},
      by_endpoint: {}
    },
    response_times: {
      avg: 0,
      min: Infinity,
      max: 0,
      total: 0
    },
    errors: {
      total: 0,
      by_type: {},
      last_error: null
    }
  };
  
  res.json({
    success: true,
    message: 'Metrics reset successfully'
  });
};

// Global error metrics
global.errorMetrics = apiMetrics.errors;

module.exports = {
  requestLogger,
  healthCheck,
  errorTracker,
  metricsCollector,
  getMetrics,
  resetMetrics
};