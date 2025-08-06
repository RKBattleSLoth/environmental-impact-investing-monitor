const express = require('express');
const router = express.Router();
const { getCurrentPrices, getHistoricalPrices, getTrendAnalysis } = require('../controllers/carbonPricesController');

// GET /api/v1/carbon-prices - Current carbon prices
router.get('/', getCurrentPrices);

// GET /api/v1/carbon-prices/historical - Historical price data
router.get('/historical', getHistoricalPrices);

// GET /api/v1/carbon-prices/trends - Trend analysis
router.get('/trends', getTrendAnalysis);

module.exports = router;