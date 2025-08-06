const express = require('express');
const router = express.Router();

// Import route modules
const briefsRoutes = require('./briefs');
const carbonPricesRoutes = require('./carbon-prices');
const metricsRoutes = require('./metrics');
const searchRoutes = require('./search');
const generateRoutes = require('./generate');

// API Info
router.get('/', (req, res) => {
  res.json({
    name: 'EIIM API',
    version: '1.0.0',
    description: 'Environmental Impact Investing Monitor API',
    endpoints: {
      briefs: '/briefs',
      carbonPrices: '/carbon-prices',
      metrics: '/metrics',
      search: '/search',
      generate: '/generate'
    }
  });
});

// Mount routes
router.use('/briefs', briefsRoutes);
router.use('/carbon-prices', carbonPricesRoutes);
router.use('/metrics', metricsRoutes);
router.use('/search', searchRoutes);
router.use('/generate', generateRoutes);

module.exports = router;