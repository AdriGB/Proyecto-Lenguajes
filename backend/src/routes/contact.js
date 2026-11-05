// backend/src/routes/contact.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/auth');

// Public inquiry submission (optional token links user_id)
router.post('/', optionalAuthenticateToken, contactController.submitMessage);

// Authenticated user inquiries inbox
router.get('/my-inquiries', authenticateToken, contactController.getMyInquiries);

module.exports = router;
