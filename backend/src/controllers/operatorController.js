// backend/src/controllers/operatorController.js
const { getDb } = require('../database/db');
const { sendInquiryReply } = require('../services/emailService');

/**
 * GET /api/operator/messages
 * Protected: requires role 'operador' or 'administrador'.
 * Query params: ?status=pendiente | respondida
 * Returns: Direct Array of contact messages ordered by created_at DESC.
 */
function getMessages(req, res, next) {
  try {
    const db = getDb();
    let sql = 'SELECT * FROM contact_messages';
    const params = [];

    if (req.query.status && typeof req.query.status === 'string') {
      const filterStatus = req.query.status.trim().toLowerCase();
      if (filterStatus === 'pendiente' || filterStatus === 'respondida') {
        sql += ' WHERE status = ?';
        params.push(filterStatus);
      }
    }

    sql += ' ORDER BY created_at DESC, id DESC';

    const messages = db.prepare(sql).all(...params);
    return res.status(200).json(messages);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/operator/messages/:id
 * Protected: requires role 'operador' or 'administrador'.
 * Returns single contact message details.
 */
function getMessageById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(404).json({ error: 'Mensaje de contacto no encontrado' });
    }

    const db = getDb();
    const message = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);

    if (!message) {
      return res.status(404).json({ error: 'Mensaje de contacto no encontrado' });
    }

    return res.status(200).json(message);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/operator/messages/:id/respond
 * Protected: requires role 'operador' or 'administrador'.
 * Body: { response_message }
 * Updates message status to 'respondida', sets response_message & responded_at timestamp,
 * and calls emailService without throwing if unconfigured.
 */
async function respondMessage(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(404).json({ error: 'Mensaje de contacto no encontrado' });
    }

    const { response_message } = req.body || {};
    if (!response_message || typeof response_message !== 'string' || !response_message.trim()) {
      return res.status(400).json({ error: 'El mensaje de respuesta es obligatorio' });
    }

    const trimmedResponse = response_message.trim();
    const db = getDb();

    // Verify existence of contact message
    const existing = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Mensaje de contacto no encontrado' });
    }

    // Update database record
    const updateStmt = db.prepare(`
      UPDATE contact_messages
      SET status = 'respondida',
          response_message = ?,
          responded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(trimmedResponse, id);

    // Retrieve updated record
    const updated = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);

    // Dispatch notification email (graceful fallback inside emailService, non-throwing)
    try {
      await sendInquiryReply({
        to: existing.email,
        recipientName: existing.name,
        name: existing.name,
        inquiryType: existing.inquiry_type,
        originalMessage: existing.message,
        responseMessage: trimmedResponse
      });
    } catch (emailErr) {
      console.warn(`[operatorController] Email dispatch warning: ${emailErr.message}. Response was saved.`);
    }

    return res.status(200).json({
      success: true,
      message: 'Respuesta registrada y procesada exitosamente',
      id: updated.id,
      status: updated.status,
      response_message: updated.response_message,
      responded_at: updated.responded_at,
      data: updated
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMessages,
  getMessageById,
  respondMessage
};
