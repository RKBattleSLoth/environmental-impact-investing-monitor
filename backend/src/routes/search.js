const express = require('express');
const router = express.Router();
const { searchContent } = require('../controllers/searchController');

// GET /api/v1/search - Search archived content
router.get('/', searchContent);

module.exports = router;