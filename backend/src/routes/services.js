// backend/src/routes/services.js
const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Public route
router.get('/', servicesController.getServices);

// Admin-only routes
router.post('/', authenticateToken, requireRole('administrador'), servicesController.createService);
router.put('/:id', authenticateToken, requireRole('administrador'), servicesController.updateService);
router.delete('/:id', authenticateToken, requireRole('administrador'), servicesController.deleteService);

module.exports = router;
