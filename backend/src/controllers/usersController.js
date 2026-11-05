// backend/src/controllers/usersController.js
const { getDb } = require('../database/db');

const ALLOWED_ROLES = ['usuario_normal', 'operador', 'administrador'];

/**
 * GET /api/users
 * Returns list of registered users strictly omitting password_hash.
 * Protected: Administrator only.
 */
function getAll(req, res, next) {
  try {
    const db = getDb();
    const users = db.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY created_at ASC
    `).all();

    return res.status(200).json(users);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/users/:id
 * Returns a single user by ID omitting password_hash.
 * Protected: Administrator only.
 */
function getById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    const db = getDb();
    const user = db.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE id = ?
    `).get(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/users/:id/role
 * Updates user role.
 * Validates role in ('usuario_normal', 'operador', 'administrador').
 * Prevents administrator lockout (cannot demote the only remaining administrator).
 * Protected: Administrator only.
 */
function updateRole(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Cuerpo de solicitud requerido' });
    }

    const { role } = req.body;
    if (!role || typeof role !== 'string' || !ALLOWED_ROLES.includes(role.trim())) {
      return res.status(400).json({
        error: `Rol inválido. Los roles permitidos son: ${ALLOWED_ROLES.join(', ')}`
      });
    }

    const newRole = role.trim();
    const db = getDb();

    // Check user existence
    const targetUser = db.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE id = ?
    `).get(id);

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Lockout Prevention Rule:
    // If the target user is currently an 'administrador' and the new role is NOT 'administrador',
    // ensure there is at least one OTHER active administrator in the database.
    if (targetUser.role === 'administrador' && newRole !== 'administrador') {
      const adminCountRow = db.prepare(`
        SELECT COUNT(*) AS count
        FROM users
        WHERE role = 'administrador'
      `).get();

      const adminCount = adminCountRow ? Number(adminCountRow.count) : 0;
      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'Operación no permitida: No es posible cambiar el rol del único administrador del sistema para evitar el bloqueo del acceso administrativo'
        });
      }
    }

    // Execute role update
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, id);

    const updatedUser = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: newRole,
      created_at: targetUser.created_at
    };

    return res.status(200).json(updatedUser);
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/users/:id
 * Removes user account from database.
 * Prevents administrator lockout (self-deletion and last admin removal).
 * SQLite foreign key ON DELETE SET NULL ensures contact_messages are preserved.
 * Protected: Administrator only.
 */
function remove(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    const db = getDb();
    const targetUser = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Lockout Prevention: Cannot delete self
    if (req.user && req.user.id === id) {
      return res.status(400).json({
        error: 'Operación no permitida: No puede eliminar su propia cuenta de administrador en sesión'
      });
    }

    // Lockout Prevention: Cannot delete the last administrator
    if (targetUser.role === 'administrador') {
      const adminCountRow = db.prepare(`
        SELECT COUNT(*) AS count
        FROM users
        WHERE role = 'administrador'
      `).get();

      const adminCount = adminCountRow ? Number(adminCountRow.count) : 0;
      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'Operación no permitida: No es posible eliminar al único administrador del sistema'
        });
      }
    }

    // Execute deletion (PRAGMA foreign_keys = ON sets user_id = NULL in contact_messages)
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      id
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAll,
  getById,
  updateRole,
  remove
};
