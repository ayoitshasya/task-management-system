// reportRoutes.js - Report generation route (protected)
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { generateReport } = require('../controllers/reportController');

// GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', authMiddleware, generateReport);

module.exports = router;
