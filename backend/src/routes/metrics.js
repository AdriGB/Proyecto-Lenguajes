// backend/src/routes/metrics.js
const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// 1. Public Visit Counter Tracking
router.post('/visit', metricsController.recordVisit);

// 2. Administrator KPI & Analytics Aggregation
router.get('/', authenticateToken, requireRole('administrador'), metricsController.getMetrics);

module.exports = router;
