const express = require('express');
const router = express.Router();
const { getBriefs, getBriefByDate, createBrief } = require('../controllers/briefsController');

// GET /api/v1/briefs - Get daily briefs with pagination
router.get('/', getBriefs);

// GET /api/v1/briefs/:date - Get specific date brief
router.get('/:date', getBriefByDate);

// POST /api/v1/briefs - Create new brief (internal)
router.post('/', createBrief);

module.exports = router;