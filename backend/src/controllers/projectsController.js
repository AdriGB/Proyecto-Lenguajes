// backend/src/controllers/projectsController.js
const { getDb } = require('../database/db');

/**
 * Public Preview: returns active published projects ordered by created_at DESC.
 * Public access (no auth required).
 * Route: GET /api/projects/preview
 */
function getPreview(req, res, next) {
  try {
    const db = getDb();
    const projects = db.prepare(`
      SELECT id, title, description, short_description, technologies, image_url, demo_url, repository_url, is_published, created_at, updated_at
      FROM projects
      WHERE is_published = 1
      ORDER BY created_at DESC
    `).all();

    return res.status(200).json(projects);
  } catch (error) {
    return next(error);
  }
}

/**
 * Authenticated Catalog: returns all published projects (or all projects for admin with ?all=true).
 * Protected (usuario_normal, operador, administrador).
 * Route: GET /api/projects
 */
function getAll(req, res, next) {
  try {
    const db = getDb();
    let sql = 'SELECT * FROM projects WHERE is_published = 1 ORDER BY created_at DESC';

    // Allow administrator to query all projects (including unpublished drafts)
    if (req.user && req.user.role === 'administrador' && (req.query.all === 'true' || req.query.include_drafts === 'true')) {
      sql = 'SELECT * FROM projects ORDER BY created_at DESC';
    }

    const projects = db.prepare(sql).all();
    return res.status(200).json(projects);
  } catch (error) {
    return next(error);
  }
}

/**
 * Project Detail: returns a single project by ID.
 * If is_published = 0, only administrators can view; otherwise return 404.
 * Protected (usuario_normal, operador, administrador).
 * Route: GET /api/projects/:id
 */
function getById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // If unpublished, only administrators may access
    if (project.is_published === 0 && (!req.user || req.user.role !== 'administrador')) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    return res.status(200).json(project);
  } catch (error) {
    return next(error);
  }
}

/**
 * Admin Create: validates required fields, inserts record into SQLite, returns HTTP 201.
 * Admin only (administrador).
 * Route: POST /api/projects
 */
function create(req, res, next) {
  try {
    const { title, description, short_description, technologies, image_url, demo_url, repository_url, is_published } = req.body || {};

    // Validation of required fields
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'El campo title es obligatorio' });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'El campo description es obligatorio' });
    }
    if (!short_description || typeof short_description !== 'string' || !short_description.trim()) {
      return res.status(400).json({ error: 'El campo short_description es obligatorio' });
    }
    if (!technologies || (typeof technologies !== 'string' && !Array.isArray(technologies))) {
      return res.status(400).json({ error: 'El campo technologies es obligatorio' });
    }
    if (typeof technologies === 'string' && !technologies.trim()) {
      return res.status(400).json({ error: 'El campo technologies no puede estar vacío' });
    }
    if (Array.isArray(technologies) && technologies.length === 0) {
      return res.status(400).json({ error: 'El campo technologies debe contener al menos un elemento' });
    }

    // Normalization
    const techValue = Array.isArray(technologies) ? JSON.stringify(technologies) : technologies.trim();
    let publishedValue = 1;
    if (is_published !== undefined) {
      publishedValue = (is_published === 0 || is_published === false || is_published === '0') ? 0 : 1;
    }

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO projects (title, description, short_description, technologies, image_url, demo_url, repository_url, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title.trim(),
      description.trim(),
      short_description.trim(),
      techValue,
      image_url ? String(image_url).trim() : null,
      demo_url ? String(demo_url).trim() : null,
      repository_url ? String(repository_url).trim() : null,
      publishedValue
    );

    const createdId = Number(result.lastInsertRowid);
    const createdProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(createdId);

    return res.status(201).json(createdProject);
  } catch (error) {
    return next(error);
  }
}

/**
 * Admin Update: updates fields including is_published and updated_at, returns HTTP 200.
 * Admin only (administrador).
 * Route: PUT /api/projects/:id
 */
function update(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Merge incoming changes with existing fields (support partial updates)
    const title = req.body && req.body.title !== undefined ? String(req.body.title).trim() : existing.title;
    const description = req.body && req.body.description !== undefined ? String(req.body.description).trim() : existing.description;
    const short_description = req.body && req.body.short_description !== undefined ? String(req.body.short_description).trim() : existing.short_description;

    let technologies = existing.technologies;
    if (req.body && req.body.technologies !== undefined) {
      technologies = Array.isArray(req.body.technologies) ? JSON.stringify(req.body.technologies) : String(req.body.technologies).trim();
    }

    const image_url = req.body && req.body.image_url !== undefined
      ? (req.body.image_url ? String(req.body.image_url).trim() : null)
      : existing.image_url;
    const demo_url = req.body && req.body.demo_url !== undefined
      ? (req.body.demo_url ? String(req.body.demo_url).trim() : null)
      : existing.demo_url;
    const repository_url = req.body && req.body.repository_url !== undefined
      ? (req.body.repository_url ? String(req.body.repository_url).trim() : null)
      : existing.repository_url;

    let is_published = existing.is_published;
    if (req.body && req.body.is_published !== undefined) {
      is_published = (req.body.is_published === 0 || req.body.is_published === false || req.body.is_published === '0') ? 0 : 1;
    }

    db.prepare(`
      UPDATE projects
      SET title = ?,
          description = ?,
          short_description = ?,
          technologies = ?,
          image_url = ?,
          demo_url = ?,
          repository_url = ?,
          is_published = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title,
      description,
      short_description,
      technologies,
      image_url,
      demo_url,
      repository_url,
      is_published,
      id
    );

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return res.status(200).json(updated);
  } catch (error) {
    return next(error);
  }
}

/**
 * Admin Delete: deletes record from SQLite, returns HTTP 200 with confirmation message.
 * Admin only (administrador).
 * Route: DELETE /api/projects/:id
 */
function remove(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    return res.status(200).json({ message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPreview,
  getAll,
  getById,
  create,
  update,
  remove
};
