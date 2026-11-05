// backend/src/database/db.js
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const config = require('../config');

// Resolve database storage path
const DB_PATH = process.env.DB_PATH || config.dbPath || path.resolve(__dirname, '../../data/portfolio.sqlite');

let dbInstance = null;

/**
 * Returns the singleton SQLite database instance.
 * Automatically creates parent directories and enforces PRAGMAs.
 */
function getDb() {
  if (!dbInstance) {
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    dbInstance = new DatabaseSync(DB_PATH);
    // Enforce foreign key constraints, WAL journal mode, and busy timeout
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA busy_timeout = 5000;');
  }
  return dbInstance;
}

/**
 * Initializes database schema from schema.sql
 */
function initDb() {
  const db = getDb();
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  return db;
}

/**
 * Gracefully closes the database connection.
 */
function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  getDb,
  initDb,
  closeDb,
  DB_PATH
};
