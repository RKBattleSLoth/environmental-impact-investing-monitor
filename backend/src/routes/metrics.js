const express = require('express');
const router = express.Router();
const { getCurrentMetrics, getHistoricalMetrics } = require('../controllers/metricsController');

// GET /api/v1/metrics - Current ecosystem metrics
router.get('/', getCurrentMetrics);

// GET /api/v1/metrics/historical - Historical metrics data
router.get('/historical', getHistoricalMetrics);

module.exports = router;