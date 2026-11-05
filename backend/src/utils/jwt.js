// backend/src/utils/jwt.js
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generates a signed JWT for an authenticated user.
 * Payload: { id, name, email, role }
 */
function generateToken(user, options = {}) {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: options.expiresIn || '7d'
  });
}

/**
 * Synchronously verifies a JWT against JWT_SECRET.
 * Throws an error if the token is invalid, forged, or expired.
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = {
  generateToken,
  verifyToken
};
