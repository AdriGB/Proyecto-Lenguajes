// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Enforce authentication and administrator role across all user administration endpoints
router.use(authenticateToken);
router.use(requireRole('administrador'));

// GET /api/users - List all users (strictly omitting password_hash)
router.get('/', usersController.getAll);

// GET /api/users/:id - Get single user
router.get('/:id', usersController.getById);

// PUT /api/users/:id/role - Update user role with lockout prevention
router.put('/:id/role', usersController.updateRole);

// DELETE /api/users/:id - Delete user account with cascade preservation
router.delete('/:id', usersController.remove);

module.exports = router;
