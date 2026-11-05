/**
 * Test Suite Configuration
 */
const path = require('node:path');

const config = {
  apiUrl: process.env.TEST_API_URL || 'http://localhost:5000',
  dbPath: process.env.TEST_DB_PATH || path.resolve(__dirname, '../../backend/data/portfolio.db'),
  verbose: process.env.VERBOSE === 'true' || process.env.VERBOSE === '1',
  requestTimeoutMs: parseInt(process.env.TEST_TIMEOUT_MS || '10000', 10),
  defaultCredentials: {
    admin: {
      email: 'admin@portfolio.local',
      password: 'Admin123!',
      role: 'administrador'
    },
    operator: {
      email: 'operador@portfolio.local',
      password: 'Operador123!',
      role: 'operador'
    },
    user: {
      email: 'usuario@portfolio.local',
      password: 'Usuario123!',
      role: 'usuario_normal'
    }
  }
};

module.exports = config;
