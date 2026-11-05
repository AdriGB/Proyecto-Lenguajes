// backend/src/middleware/role.js

/**
 * Role-based authorization middleware factory.
 * Verifies that req.user.role matches at least one of the allowed roles.
 * Returns 403 Forbidden on insufficient permissions.
 *
 * Usage:
 *   router.get('/operator/messages', authenticateToken, requireRole('operador', 'administrador'), handler);
 *   router.post('/projects', authenticateToken, requireRole('administrador'), handler);
 *   router.post('/services', authenticateToken, requireRole(['administrador']), handler);
 */
function requireRole(...allowedRoles) {
  // Support both requireRole('operador', 'administrador') and requireRole(['operador', 'administrador'])
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Acceso no autorizado: Usuario no autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acceso denegado: No cuenta con los privilegios requeridos para esta operación'
      });
    }

    return next();
  };
}

module.exports = {
  requireRole,
  roleMiddleware: requireRole
};
