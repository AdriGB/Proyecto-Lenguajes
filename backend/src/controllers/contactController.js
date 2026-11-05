// backend/src/controllers/contactController.js
const { getDb } = require('../database/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/contact
 * Public endpoint to submit contact inquiries.
 * If user is logged in (optionalAuthenticateToken), links inquiry with their user_id.
 */
function submitMessage(req, res, next) {
  try {
    const body = req.body;

    // Validate body payload exists and is non-empty
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return res.status(400).json({ error: 'Datos de contacto requeridos' });
    }

    const { name, email, inquiry_type, message } = body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'El nombre es obligatorio y debe tener al menos 2 caracteres' });
    }

    // Validate email
    if (!email || typeof email !== 'string' || !email.trim() || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Correo electrónico válido requerido' });
    }

    // Validate inquiry_type
    if (!inquiry_type || typeof inquiry_type !== 'string' || !inquiry_type.trim()) {
      return res.status(400).json({ error: 'El tipo de consulta es obligatorio' });
    }

    // Validate message (ensure non-whitespace and non-empty)
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'El mensaje es obligatorio' });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedInquiryType = inquiry_type.trim();
    const trimmedMessage = message.trim();

    // Link authenticated user ID if present from optional token
    let userId = null;
    if (req.user && req.user.id) {
      userId = Number(req.user.id);
    }

    const db = getDb();

    // Insert into contact_messages
    const insertStmt = db.prepare(`
      INSERT INTO contact_messages (user_id, name, email, inquiry_type, message, status)
      VALUES (?, ?, ?, ?, ?, 'pendiente')
    `);

    const result = insertStmt.run(
      userId,
      trimmedName,
      normalizedEmail,
      trimmedInquiryType,
      trimmedMessage
    );

    const messageId = Number(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Consulta enviada con éxito',
      id: messageId,
      status: 'pendiente',
      user_id: userId,
      data: {
        id: messageId,
        user_id: userId,
        name: trimmedName,
        email: normalizedEmail,
        inquiry_type: trimmedInquiryType,
        message: trimmedMessage,
        status: 'pendiente',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/contact/my-inquiries
 * Authenticated endpoint: returns all contact messages submitted by the current user.
 */
function getMyInquiries(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    const db = getDb();
    const inquiries = db.prepare(`
      SELECT id, user_id, name, email, inquiry_type, message, status, response_message, responded_at, created_at
      FROM contact_messages
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC, id DESC
    `).all(Number(req.user.id));

    return res.status(200).json(inquiries);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  submitMessage,
  getMyInquiries
};
