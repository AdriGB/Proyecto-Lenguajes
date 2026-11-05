// backend/src/routes/projects.js
const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projectsController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// 1. Public Preview Endpoint (Must be declared BEFORE /:id)
router.get('/preview', projectsController.getPreview);

// 2. Authenticated Catalog Endpoints
router.get('/', authenticateToken, projectsController.getAll);
router.get('/:id', authenticateToken, projectsController.getById);

// 3. Administrator CRUD Endpoints
router.post('/', authenticateToken, requireRole('administrador'), projectsController.create);
router.put('/:id', authenticateToken, requireRole('administrador'), projectsController.update);
router.delete('/:id', authenticateToken, requireRole('administrador'), projectsController.remove);

module.exports = router;
