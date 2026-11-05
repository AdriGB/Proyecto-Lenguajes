// backend/src/database/migrate.js
const { initDb, closeDb, DB_PATH } = require('./db');

function migrateDatabase() {
  console.log(`[Database Migration] Running schema migration on: ${DB_PATH}`);
  try {
    initDb();
    console.log('[Database Migration] Schema applied successfully.');
    return true;
  } catch (error) {
    console.error('[Database Migration Error]', error);
    throw error;
  }
}

if (require.main === module) {
  try {
    migrateDatabase();
    closeDb();
    process.exit(0);
  } catch (err) {
    closeDb();
    process.exit(1);
  }
}

module.exports = { migrateDatabase };
