// backend/src/database/verify.js
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const { getDb, closeDb } = require('./db');
const { migrateDatabase } = require('./migrate');
const { seedDatabase } = require('./seed');

function runVerification() {
  console.log('========================================');
  console.log(' SQLite Database Verification Suite');
  console.log('========================================\n');

  // Step 1: Ensure Migration and Seeder run without errors
  migrateDatabase();
  seedDatabase();
  const db = getDb();

  // Test 1: Verify PRAGMA foreign_keys is ON
  console.log('Test 1: Checking PRAGMA foreign_keys...');
  const pragmaFk = db.prepare('PRAGMA foreign_keys;').get();
  assert.strictEqual(pragmaFk.foreign_keys, 1, 'PRAGMA foreign_keys must be 1 (enabled)');
  console.log('  [PASS] Foreign keys are actively enforced.\n');

  // Test 2: Verify all 5 tables exist
  console.log('Test 2: Verifying required tables in sqlite_master...');
  const expectedTables = ['users', 'projects', 'services', 'contact_messages', 'site_metrics'];
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  for (const t of expectedTables) {
    assert(tables.includes(t), `Table "${t}" must exist in the database`);
    console.log(`  [PASS] Table "${t}" exists.`);
  }
  console.log('');

  // Test 3: Verify all 6 performance indexes exist
  console.log('Test 3: Verifying required indexes in sqlite_master...');
  const expectedIndexes = [
    'idx_users_email',
    'idx_contact_messages_status',
    'idx_contact_messages_created_at',
    'idx_contact_messages_inquiry_type',
    'idx_projects_is_published',
    'idx_services_is_published'
  ];
  const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all().map(i => i.name);
  for (const idx of expectedIndexes) {
    assert(indexes.includes(idx), `Index "${idx}" must exist`);
    console.log(`  [PASS] Index "${idx}" exists.`);
  }
  console.log('');

  // Test 4: Verify ON DELETE SET NULL on contact_messages
  console.log('Test 4: Verifying ON DELETE SET NULL cascade behavior...');
  // Create temporary user
  const tempUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES ('Temp Cascade Test', 'temp_cascade_test@domain.local', 'hash', 'usuario_normal')
  `).run();
  const tempUserId = Number(tempUser.lastInsertRowid);

  // Create message linked to temporary user
  const tempMsg = db.prepare(`
    INSERT INTO contact_messages (user_id, name, email, inquiry_type, message)
    VALUES (?, 'Temp User', 'temp_cascade_test@domain.local', 'Consulta técnica', 'Testing cascade')
  `).run();
  const tempMsgId = Number(tempMsg.lastInsertRowid);

  // Delete temporary user
  db.prepare('DELETE FROM users WHERE id = ?').run(tempUserId);

  // Assert user_id on message became null
  const retrievedMsg = db.prepare('SELECT user_id FROM contact_messages WHERE id = ?').get(tempMsgId);
  assert.strictEqual(retrievedMsg.user_id, null, 'user_id must be set to null on user deletion');
  
  // Cleanup temp message
  db.prepare('DELETE FROM contact_messages WHERE id = ?').run(tempMsgId);
  console.log('  [PASS] ON DELETE SET NULL correctly set user_id to NULL upon parent user deletion.\n');

  // Test 5: Verify Seed Accounts & Bcrypt Passwords
  console.log('Test 5: Verifying test accounts and password hashes...');
  const testAccounts = [
    { email: 'admin@portfolio.local', expectedPass: 'admin123', role: 'administrador' },
    { email: 'operador@portfolio.local', expectedPass: 'operador123', role: 'operador' },
    { email: 'usuario@portfolio.local', expectedPass: 'usuario123', role: 'usuario_normal' }
  ];

  for (const acc of testAccounts) {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(acc.email);
    assert(user, `User ${acc.email} must exist in users table`);
    assert.strictEqual(user.role, acc.role, `User ${acc.email} role must be ${acc.role}`);
    const valid = bcrypt.compareSync(acc.expectedPass, user.password_hash);
    assert(valid, `Password for ${acc.email} must match "${acc.expectedPass}"`);
    console.log(`  [PASS] User ${acc.email} verified with role "${acc.role}" and valid bcrypt hash.`);
  }
  console.log('');

  // Test 6: Verify Content Counts
  console.log('Test 6: Verifying seed content counts...');
  const projectCount = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
  assert(projectCount >= 4, `Expected at least 4 projects, found ${projectCount}`);
  console.log(`  [PASS] Projects count: ${projectCount}`);

  const serviceCount = db.prepare('SELECT COUNT(*) as c FROM services').get().c;
  assert(serviceCount >= 4, `Expected at least 4 services, found ${serviceCount}`);
  console.log(`  [PASS] Services count: ${serviceCount}`);

  const messageCount = db.prepare('SELECT COUNT(*) as c FROM contact_messages').get().c;
  assert(messageCount >= 5, `Expected at least 5 contact messages, found ${messageCount}`);
  console.log(`  [PASS] Contact messages count: ${messageCount}`);

  const generalVisits = db.prepare("SELECT count FROM site_metrics WHERE metric_key = 'visitas_generales'").get();
  assert(generalVisits && generalVisits.count >= 0, 'Metric visitas_generales must exist');
  console.log(`  [PASS] Metric "visitas_generales": ${generalVisits.count}`);

  const authAccess = db.prepare("SELECT count FROM site_metrics WHERE metric_key = 'accesos_autenticados'").get();
  assert(authAccess && authAccess.count >= 0, 'Metric accesos_autenticados must exist');
  console.log(`  [PASS] Metric "accesos_autenticados": ${authAccess.count}\n`);

  console.log('========================================');
  console.log(' ALL DATABASE VERIFICATION TESTS PASSED');
  console.log('========================================');
}

if (require.main === module) {
  try {
    runVerification();
    closeDb();
    process.exit(0);
  } catch (err) {
    console.error('\n[DATABASE VERIFICATION FAILED]', err);
    closeDb();
    process.exit(1);
  }
}

module.exports = { runVerification };
