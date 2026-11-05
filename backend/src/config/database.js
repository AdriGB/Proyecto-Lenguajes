// backend/src/config/database.js
const { getDb, initDb, closeDb, DB_PATH } = require('../database/db');

module.exports = {
  getDb,
  initDb,
  closeDb,
  DB_PATH,
  get db() {
    return getDb();
  }
};
