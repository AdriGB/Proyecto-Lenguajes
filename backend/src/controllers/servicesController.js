// backend/src/controllers/servicesController.js
const { getDb } = require('../database/db');

// Valid Lucide React icon name pattern (PascalCase alphanumeric, e.g. Code, Server, Database, Layout)
const LUCIDE_ICON_REGEX = /^[A-Z][A-Za-z0-9]{1,40}$/;

/**
 * GET /api/services
 * Public endpoint: returns all active published services.
 */
function getServices(req, res, next) {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, title, description, icon, is_published, created_at, updated_at
      FROM services
      WHERE is_published = 1
      ORDER BY id ASC
    `);
    const services = stmt.all();

    // Ensure icon fallback if null or empty
    const sanitizedServices = services.map(srv => ({
      ...srv,
      icon: srv.icon && srv.icon.trim() ? srv.icon.trim() : 'Code'
    }));

    return res.status(200).json(sanitizedServices);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/services
 * Admin-only endpoint: creates a new service.
 */
function createService(req, res, next) {
  try {
    const { title, description, icon, is_published } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'El título del servicio es obligatorio' });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'La descripción del servicio es obligatoria' });
    }
    if (!icon || typeof icon !== 'string' || !icon.trim()) {
      return res.status(400).json({ error: 'El nombre del icono de Lucide es obligatorio' });
    }

    const cleanIcon = icon.trim();
    if (!LUCIDE_ICON_REGEX.test(cleanIcon)) {
      return res.status(400).json({
        error: 'El nombre del icono debe ser un identificador válido de Lucide React (ej. Code, Server, Database, Layout)'
      });
    }

    const publishedStatus = (is_published === undefined || is_published === null)
      ? 1
      : (Number(is_published) ? 1 : 0);

    const db = getDb();
    const insertStmt = db.prepare(`
      INSERT INTO services (title, description, icon, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = insertStmt.run(title.trim(), description.trim(), cleanIcon, publishedStatus);
    const newId = Number(result.lastInsertRowid);

    const selectStmt = db.prepare(`
      SELECT id, title, description, icon, is_published, created_at, updated_at
      FROM services
      WHERE id = ?
    `);
    const createdService = selectStmt.get(newId);

    return res.status(201).json(createdService);
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/services/:id
 * Admin-only endpoint: updates an existing service.
 */
function updateService(req, res, next) {
  try {
    const serviceId = parseInt(req.params.id, 10);
    if (isNaN(serviceId) || serviceId <= 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const db = getDb();
    const checkStmt = db.prepare('SELECT * FROM services WHERE id = ?');
    const existing = checkStmt.get(serviceId);

    if (!existing) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const { title, description, icon, is_published } = req.body || {};

    let updatedTitle = existing.title;
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'El título no puede estar vacío' });
      }
      updatedTitle = title.trim();
    }

    let updatedDescription = existing.description;
    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({ error: 'La descripción no puede estar vacía' });
      }
      updatedDescription = description.trim();
    }

    let updatedIcon = existing.icon;
    if (icon !== undefined) {
      if (typeof icon !== 'string' || !icon.trim()) {
        return res.status(400).json({ error: 'El icono no puede estar vacío' });
      }
      const cleanIcon = icon.trim();
      if (!LUCIDE_ICON_REGEX.test(cleanIcon)) {
        return res.status(400).json({
          error: 'El nombre del icono debe ser un identificador válido de Lucide React'
        });
      }
      updatedIcon = cleanIcon;
    }

    let updatedPublished = existing.is_published;
    if (is_published !== undefined) {
      updatedPublished = (is_published === 0 || is_published === false || is_published === '0') ? 0 : 1;
    }

    const updateStmt = db.prepare(`
      UPDATE services
      SET title = ?, description = ?, icon = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(updatedTitle, updatedDescription, updatedIcon, updatedPublished, serviceId);

    const updatedService = checkStmt.get(serviceId);
    return res.status(200).json(updatedService);
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/services/:id
 * Admin-only endpoint: deletes a service.
 */
function deleteService(req, res, next) {
  try {
    const serviceId = parseInt(req.params.id, 10);
    if (isNaN(serviceId) || serviceId <= 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const db = getDb();
    const checkStmt = db.prepare('SELECT id FROM services WHERE id = ?');
    const existing = checkStmt.get(serviceId);

    if (!existing) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const deleteStmt = db.prepare('DELETE FROM services WHERE id = ?');
    deleteStmt.run(serviceId);

    return res.status(200).json({ message: 'Servicio eliminado correctamente' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getServices,
  createService,
  updateService,
  deleteService
};
