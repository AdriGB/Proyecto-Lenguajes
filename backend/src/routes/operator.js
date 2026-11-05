// backend/src/routes/operator.js
const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operatorController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All operator routes require authentication and role 'operador' or 'administrador'
router.use(authenticateToken);
router.use(requireRole('operador', 'administrador'));

// 1. List messages (supports ?status=pendiente | respondida)
router.get('/messages', operatorController.getMessages);

// 2. View message detail by ID
router.get('/messages/:id', operatorController.getMessageById);

// 3. Respond to message by ID
router.post('/messages/:id/respond', operatorController.respondMessage);

module.exports = router;
