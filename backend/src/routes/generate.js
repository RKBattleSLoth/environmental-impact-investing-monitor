const express = require('express');
const router = express.Router();
const { generateBrief, exportData } = require('../controllers/generateController');

// POST /api/v1/generate/brief - Generate brief on demand
router.post('/brief', generateBrief);

// GET /api/v1/generate/export - Export data in various formats
router.get('/export', exportData);

module.exports = router;