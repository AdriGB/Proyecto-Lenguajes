/**
 * SQLite Database Direct Query Helper using Node.js 24 node:sqlite
 */
const fs = require('node:fs');
const path = require('node:path');
const config = require('./config');

let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (err) {
  console.warn(`[WARN] node:sqlite could not be loaded: ${err.message}`);
}

const CANDIDATE_PATHS = [
  config.dbPath,
  path.resolve(__dirname, '../../backend/data/portfolio.db'),
  path.resolve(__dirname, '../../backend/data/portfolio.sqlite'),
  path.resolve(__dirname, '../../backend/portfolio.db'),
  path.resolve(__dirname, '../../data/portfolio.db'),
  path.resolve(__dirname, '../../portfolio.db')
];

class DbHelper {
  constructor() {
    this.db = null;
    this.resolvedPath = null;
  }

  getDbPath() {
    if (this.resolvedPath && fs.existsSync(this.resolvedPath)) {
      return this.resolvedPath;
    }
    for (const p of CANDIDATE_PATHS) {
      if (p && fs.existsSync(p)) {
        this.resolvedPath = p;
        return p;
      }
    }
    return config.dbPath;
  }

  isAvailable() {
    if (!DatabaseSync) return false;
    const p = this.getDbPath();
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  }

  connect() {
    if (this.db) return this.db;
    const dbPath = this.getDbPath();
    if (!this.isAvailable()) {
      throw new Error(`Database file not found. Checked candidate paths:\n  ${CANDIDATE_PATHS.join('\n  ')}`);
    }
    this.db = new DatabaseSync(dbPath);
    return this.db;
  }

  close() {
    if (this.db) {
      try {
        this.db.close();
      } catch {}
      this.db = null;
    }
  }

  query(sql, ...params) {
    const db = this.connect();
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }

  queryOne(sql, ...params) {
    const rows = this.query(sql, ...params);
    return rows.length > 0 ? rows[0] : null;
  }

  exec(sql) {
    const db = this.connect();
    return db.exec(sql);
  }

  getTableNames() {
    const rows = this.query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
    return rows.map(r => r.name);
  }

  getTableColumns(tableName) {
    return this.query(`PRAGMA table_info("${tableName}")`);
  }

  getIndexNames(tableName) {
    const rows = this.query(`PRAGMA index_list("${tableName}")`);
    return rows.map(r => r.name);
  }

  isForeignKeysEnabled() {
    const row = this.queryOne(`PRAGMA foreign_keys`);
    return row ? Object.values(row)[0] === 1 : false;
  }
}

module.exports = new DbHelper();
