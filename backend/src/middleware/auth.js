// backend/src/middleware/auth.js
const { verifyToken } = require('../utils/jwt');

/**
 * Strict authentication middleware:
 * Validates Bearer token in Authorization header.
 * Returns 401 Unauthorized on missing, malformed, invalid, or expired tokens.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ error: 'Acceso no autorizado: Token no proporcionado' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso no autorizado: Formato de token inválido' });
  }

  const token = authHeader.substring(7).trim();

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Acceso no autorizado: Token vacío' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Acceso no autorizado: Token inválido o expirado' });
  }
}

/**
 * Optional authentication middleware:
 * If a valid Bearer token is provided, attaches req.user.
 * If no token is provided or token is invalid, proceeds as guest without returning 401.
 */
function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7).trim();
  if (!token || token === 'null' || token === 'undefined') {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  return next();
}

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  authMiddleware: authenticateToken
};
