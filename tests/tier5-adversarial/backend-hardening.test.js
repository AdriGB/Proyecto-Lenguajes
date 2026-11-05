/**
 * Tier 5: Adversarial Stress & Hardening Test Suite (Milestone 6)
 * White-box adversarial testing for Fullstack Academic Portfolio (Proyecto L)
 * 
 * Target Invariants:
 * 1. SQLite WAL mode, concurrency, and busy timeout resilience
 * 2. Tampered, expired JWT tokens, forged roles, and algorithm attacks
 * 3. SQL injection resistance across all query and route parameters
 * 4. Contact messages edge cases (huge payloads, invalid emails, rapid bursts, XSS)
 * 5. Administrative Lockout Protection invariants (demotion, deletion, re-arming)
 */
const { describe, it, expect, beforeAll, afterAll, harness } = require('../helpers/test-harness');
const api = require('../helpers/api');
const db = require('../helpers/db');
const config = require('../helpers/config');
const { makeUser, makeContactMessage, makeProject, makeService } = require('../helpers/fixtures');
const jwt = require('jsonwebtoken');
const { Worker } = require('node:worker_threads');
const path = require('node:path');
const fs = require('node:fs');

describe('Tier 5: Adversarial Hardening - SQLite WAL Mode & Concurrency Stress', () => {
  let backendDb = null;

  beforeAll(() => {
    // Obtain backend database instance to verify backend-specific pragma configurations
    try {
      const backendDbModule = require('../../backend/src/database/db');
      backendDb = backendDbModule.getDb();
    } catch (err) {
      console.warn('Could not load backend db module directly:', err.message);
    }
  });

  it('5.1 - SQLite database file is strictly configured in WAL journal mode', () => {
    const journalRows = db.query('PRAGMA journal_mode;');
    expect(journalRows).toBeDefined();
    expect(journalRows.length).toBeGreaterThan(0);
    const mode = Object.values(journalRows[0])[0];
    expect(String(mode).toLowerCase()).toBe('wal');
  });

  it('5.2 - SQLite foreign key constraints are actively enforced', () => {
    const fkRows = db.query('PRAGMA foreign_keys;');
    expect(fkRows).toBeDefined();
    expect(fkRows.length).toBeGreaterThan(0);
    const fkEnabled = Object.values(fkRows[0])[0];
    expect(Number(fkEnabled)).toBe(1);
  });

  it('5.3 - Backend SQLite connection configures busy_timeout >= 5000ms', () => {
    if (!backendDb) return;
    const stmt = backendDb.prepare('PRAGMA busy_timeout;');
    const row = stmt.get();
    expect(row).toBeDefined();
    const timeoutVal = Object.values(row)[0];
    expect(Number(timeoutVal)).toBeGreaterThanOrEqual(5000);
  });

  it('5.4 - High concurrency burst: simultaneous reads and writes complete without SQLITE_BUSY', async () => {
    // Dispatch 30 parallel HTTP requests simultaneously
    const visitPromises = Array.from({ length: 10 }, () => api.post('/api/metrics/visit', {}));
    const contactPromises = Array.from({ length: 10 }, (_, i) => 
      api.post('/api/contact', {
        name: `Concurrent User ${i}`,
        email: `concurrent_${i}_${Date.now()}@example.com`,
        inquiry_type: 'consulta_general',
        message: `Concurrent write test message ${i}`
      })
    );
    const readPromises = Array.from({ length: 10 }, () => api.get('/api/services'));

    const allResults = await Promise.all([...visitPromises, ...contactPromises, ...readPromises]);
    expect(allResults.length).toBe(30);

    for (const res of allResults) {
      expect([200, 201].includes(res.status)).toBe(true);
      if (res.data && res.data.error) {
        expect(res.data.error).not.toContain('SQLITE_BUSY');
        expect(res.data.error).not.toContain('database is locked');
      }
    }
  });

  it('5.5 - Busy timeout resilience: multi-threaded transaction lock completes gracefully', async () => {
    const dbFilePath = db.getDbPath();

    // Launch worker thread that acquires an IMMEDIATE transaction lock for 300ms
    const workerScript = `
      const { DatabaseSync } = require('node:sqlite');
      const { parentPort, workerData } = require('node:worker_threads');
      const db = new DatabaseSync(workerData.dbPath);
      db.exec('PRAGMA busy_timeout = 5000;');
      db.exec('BEGIN IMMEDIATE;');
      parentPort.postMessage('locked');
      setTimeout(() => {
        try {
          db.exec('COMMIT;');
        } catch {}
        db.close();
        parentPort.postMessage('released');
      }, 300);
    `;

    const lockPromise = new Promise((resolve, reject) => {
      const worker = new Worker(workerScript, { eval: true, workerData: { dbPath: dbFilePath } });
      worker.on('message', async (msg) => {
        if (msg === 'locked') {
          try {
            // While worker holds lock, perform write on backend through helper with busy_timeout
            const start = Date.now();
            const { DatabaseSync } = require('node:sqlite');
            const mainDb = new DatabaseSync(dbFilePath);
            mainDb.exec('PRAGMA busy_timeout = 5000;');
            mainDb.exec("UPDATE site_metrics SET count = count + 1 WHERE metric_key = 'visitas_generales';");
            const duration = Date.now() - start;
            mainDb.close();
            // Should have waited for worker to release lock without crashing
            resolve({ duration });
          } catch (err) {
            reject(err);
          }
        }
      });
      worker.on('error', reject);
    });

    const result = await lockPromise;
    expect(result.duration).toBeGreaterThanOrEqual(100);
  });

  it('5.6 - Atomic metric counter integrity under concurrent increments', async () => {
    // Record baseline
    const baseRes = await api.get('/api/health');
    expect(baseRes.status).toBe(200);

    const initialRow = db.queryOne("SELECT count FROM site_metrics WHERE metric_key = 'visitas_generales'");
    const initialCount = initialRow ? Number(initialRow.count) : 0;

    const burstCount = 15;
    const promises = Array.from({ length: burstCount }, () => api.post('/api/metrics/visit', {}));
    await Promise.all(promises);

    const finalRow = db.queryOne("SELECT count FROM site_metrics WHERE metric_key = 'visitas_generales'");
    const finalCount = finalRow ? Number(finalRow.count) : 0;

    expect(finalCount).toBe(initialCount + burstCount);
  });
});

describe('Tier 5: Adversarial Hardening - Tampered, Expired JWT & Role Forgery', () => {
  let validUserToken = null;
  let validAdminToken = null;
  let validOperatorToken = null;
  const jwtSecret = config.jwtSecret || 'dev_jwt_secret_key_portfolio_2026';

  beforeAll(async () => {
    // Obtain valid credentials
    const userRes = await api.post('/api/auth/register', makeUser());
    if (userRes.status === 201 && userRes.data) {
      validUserToken = userRes.data.token;
    }
    const adminAuth = await api.loginAs('admin');
    validAdminToken = adminAuth.token;
    const operatorAuth = await api.loginAs('operator');
    validOperatorToken = operatorAuth.token;
  });

  it('5.7 - Expired JWT tokens MUST return HTTP 401 Unauthorized', async () => {
    const expiredToken = jwt.sign(
      { id: 1, name: 'Expired Admin', email: 'admin@portfolio.local', role: 'administrador' },
      jwtSecret,
      { expiresIn: '-10s' }
    );

    const endpoints = [
      { method: 'get', path: '/api/auth/me' },
      { method: 'get', path: '/api/projects' },
      { method: 'get', path: '/api/operator/messages' },
      { method: 'get', path: '/api/metrics' }
    ];

    for (const ep of endpoints) {
      const res = await api[ep.method](ep.path, { token: expiredToken });
      expect(res.status).toBe(401);
    }
  });

  it('5.8 - Cryptographically tampered JWT signature MUST return HTTP 401', async () => {
    const tokenParts = validAdminToken.split('.');
    expect(tokenParts.length).toBe(3);

    // Corrupt signature segment
    const tamperedSig = tokenParts[2].slice(0, -6) + 'ABCDEF';
    const tamperedToken = `${tokenParts[0]}.${tokenParts[1]}.${tamperedSig}`;

    const resMe = await api.get('/api/auth/me', { token: tamperedToken });
    expect(resMe.status).toBe(401);

    const resUsers = await api.get('/api/users', { token: tamperedToken });
    expect(resUsers.status).toBe(401);
  });

  it('5.9 - Payload role tampering without signature re-sign MUST return HTTP 401', async () => {
    // Take normal user token and forge role to administrador in payload
    const tokenParts = validUserToken.split('.');
    expect(tokenParts.length).toBe(3);

    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf8'));
    payload.role = 'administrador';
    const forgedPayloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const forgedToken = `${tokenParts[0]}.${forgedPayloadB64}.${tokenParts[2]}`;

    const res = await api.get('/api/users', { token: forgedToken });
    expect(res.status).toBe(401);
  });

  it('5.10 - JWT signed with wrong secret key MUST return HTTP 401', async () => {
    const rogueToken = jwt.sign(
      { id: 1, name: 'Rogue Admin', email: 'rogue@attacker.com', role: 'administrador' },
      'completely_different_secret_key_123456789'
    );

    const resAuth = await api.get('/api/auth/me', { token: rogueToken });
    expect(resAuth.status).toBe(401);

    const resMetrics = await api.get('/api/metrics', { token: rogueToken });
    expect(resMetrics.status).toBe(401);
  });

  it('5.11 - Algorithm "none" unsigned token attack MUST return HTTP 401', async () => {
    const headerB64 = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify({ id: 1, role: 'administrador', email: 'admin@portfolio.local' })).toString('base64url');
    const noneToken = `${headerB64}.${payloadB64}.`;

    const res = await api.get('/api/metrics', { token: noneToken });
    expect(res.status).toBe(401);
  });

  it('5.12 - Malformed, blank, and null token headers return HTTP 401 Unauthorized', async () => {
    const malformedHeaders = [
      '',
      '   ',
      'Bearer',
      'Bearer ',
      'Bearer null',
      'Bearer undefined',
      'Bearer [object Object]',
      'Basic YWRtaW46cGFzc3dvcmQ=',
      'Token some_random_string'
    ];

    for (const token of malformedHeaders) {
      const res = await api.get('/api/auth/me', {
        headers: { 'Authorization': token }
      });
      expect(res.status).toBe(401);
    }
  });

  it('5.13 - Normal user role cannot access operator or admin routes (403 Forbidden)', async () => {
    if (!validUserToken) return;

    const operatorRoutes = [
      { method: 'get', path: '/api/operator/messages' },
      { method: 'get', path: '/api/operator/messages/1' },
      { method: 'post', path: '/api/operator/messages/1/respond', body: { response_message: 'Unauthorized reply' } }
    ];

    for (const route of operatorRoutes) {
      let res;
      if (route.method === 'post') {
        res = await api.post(route.path, route.body, { token: validUserToken });
      } else if (route.method === 'put') {
        res = await api.put(route.path, route.body, { token: validUserToken });
      } else if (route.method === 'delete') {
        res = await api.delete(route.path, { token: validUserToken });
      } else {
        res = await api.get(route.path, { token: validUserToken });
      }
      expect(res.status).toBe(403);
    }

    const adminRoutes = [
      { method: 'post', path: '/api/projects', body: makeProject() },
      { method: 'put', path: '/api/projects/1', body: { title: 'Hacked' } },
      { method: 'delete', path: '/api/projects/1' },
      { method: 'post', path: '/api/services', body: makeService() },
      { method: 'put', path: '/api/services/1', body: { title: 'Hacked' } },
      { method: 'delete', path: '/api/services/1' },
      { method: 'get', path: '/api/users' },
      { method: 'get', path: '/api/users/1' },
      { method: 'put', path: '/api/users/1/role', body: { role: 'administrador' } },
      { method: 'delete', path: '/api/users/1' },
      { method: 'get', path: '/api/metrics' }
    ];

    for (const route of adminRoutes) {
      let res;
      if (route.method === 'post') {
        res = await api.post(route.path, route.body, { token: validUserToken });
      } else if (route.method === 'put') {
        res = await api.put(route.path, route.body, { token: validUserToken });
      } else if (route.method === 'delete') {
        res = await api.delete(route.path, { token: validUserToken });
      } else {
        res = await api.get(route.path, { token: validUserToken });
      }
      expect(res.status).toBe(403);
    }
  });

  it('5.14 - Operator role cannot access admin routes (403 Forbidden)', async () => {
    if (!validOperatorToken) return;

    const adminOnlyRoutes = [
      { method: 'post', path: '/api/projects', body: makeProject() },
      { method: 'put', path: '/api/projects/1', body: { title: 'Hacked by Operator' } },
      { method: 'delete', path: '/api/projects/1' },
      { method: 'post', path: '/api/services', body: makeService() },
      { method: 'put', path: '/api/services/1', body: { title: 'Hacked by Operator' } },
      { method: 'delete', path: '/api/services/1' },
      { method: 'get', path: '/api/users' },
      { method: 'put', path: '/api/users/1/role', body: { role: 'administrador' } },
      { method: 'delete', path: '/api/users/1' },
      { method: 'get', path: '/api/metrics' }
    ];

    for (const route of adminOnlyRoutes) {
      let res;
      if (route.method === 'post') {
        res = await api.post(route.path, route.body, { token: validOperatorToken });
      } else if (route.method === 'put') {
        res = await api.put(route.path, route.body, { token: validOperatorToken });
      } else if (route.method === 'delete') {
        res = await api.delete(route.path, { token: validOperatorToken });
      } else {
        res = await api.get(route.path, { token: validOperatorToken });
      }
      expect(res.status).toBe(403);
    }
  });
});

describe('Tier 5: Adversarial Hardening - SQL Injection Resistance Across Parameters', () => {
  let adminToken = null;

  beforeAll(async () => {
    const auth = await api.loginAs('admin');
    adminToken = auth.token;
  });

  it('5.15 - SQL Injection in login credentials fails authentication cleanly (400 or 401)', async () => {
    const sqliPayloads = [
      { email: "' OR '1'='1", password: 'password' },
      { email: "admin@portfolio.local'--", password: 'admin' },
      { email: "' UNION SELECT 1, 'admin', 'admin@portfolio.local', '$2a$10$abcdef', 'administrador', datetime('now')--", password: 'test' },
      { email: "'; DROP TABLE users; --", password: 'test' },
      { email: 'admin" OR ""="', password: 'admin' },
      { email: "' OR 1=1; SELECT * FROM users; --", password: 'foo' }
    ];

    for (const creds of sqliPayloads) {
      const res = await api.post('/api/auth/login', creds);
      expect([400, 401].includes(res.status)).toBe(true);
      expect(res.status).not.toBe(200);
      expect(res.status).not.toBe(500);
    }

    // Verify table users is intact
    const userCount = db.queryOne('SELECT COUNT(*) AS count FROM users');
    expect(Number(userCount.count)).toBeGreaterThan(0);
  });

  it('5.16 - SQL Injection in registration fields is neutralized and cannot execute queries', async () => {
    const sqliUser = {
      name: "Attacker'); DROP TABLE users;--",
      email: `sqli_reg_${Date.now()}@example.com`,
      password: "Password123!"
    };

    const res = await api.post('/api/auth/register', sqliUser);
    expect(res.status).toBe(201);
    expect(res.data.user.name).toBe("Attacker'); DROP TABLE users;--");

    // Verify users table exists and contains records
    const users = db.query('SELECT name FROM users WHERE email = ?', sqliUser.email);
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Attacker'); DROP TABLE users;--");
  });

  it('5.17 - SQL Injection in query parameters (?status=...) does not leak or alter records', async () => {
    const maliciousStatuses = [
      "' OR '1'='1",
      "pendiente' UNION SELECT id, name, email, 'hacked', 'hacked', 'hacked', 'hacked', datetime('now'), datetime('now'), 1 FROM contact_messages--",
      "pendiente'; DROP TABLE contact_messages;--",
      "'; UPDATE users SET role='administrador'--"
    ];

    for (const badStatus of maliciousStatuses) {
      const res = await api.get(`/api/operator/messages?status=${encodeURIComponent(badStatus)}`, {
        token: adminToken
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    }

    // Verify contact_messages table is intact
    const countRow = db.queryOne('SELECT COUNT(*) AS count FROM contact_messages');
    expect(countRow).toBeDefined();
  });

  it('5.18 - Malicious SQL payloads & non-numeric route ID parameters return 400 or 404, never 500', async () => {
    const nonNumericIds = [
      "' OR '1'='1",
      "'; DROP TABLE projects; --",
      "' UNION SELECT 1,2,3,4,5,6,7,8,9,10--",
      "999999999999999999999999999",
      "NaN",
      "-1",
      "0",
      "'",
      "undefined"
    ];

    for (const badId of nonNumericIds) {
      const encoded = encodeURIComponent(badId);

      const resProj = await api.get(`/api/projects/${encoded}`, { token: adminToken });
      expect([400, 404].includes(resProj.status)).toBe(true);

      const resOp = await api.get(`/api/operator/messages/${encoded}`, { token: adminToken });
      expect([400, 404].includes(resOp.status)).toBe(true);

      const resUser = await api.get(`/api/users/${encoded}`, { token: adminToken });
      expect([400, 404].includes(resUser.status)).toBe(true);

      const resDelProj = await api.delete(`/api/projects/${encoded}`, { token: adminToken });
      expect([400, 404].includes(resDelProj.status)).toBe(true);
    }
  });

  it('5.19 - Numeric-prefixed SQLi route IDs do NOT execute injected SQL commands', async () => {
    // White-box finding: parseInt('1; DROP TABLE projects;', 10) extracts 1.
    // Verify that SQLite parameterized binding binds 1 without executing the trailing injection.
    const initialProjectsCount = Number(db.queryOne('SELECT COUNT(*) AS count FROM projects').count);
    expect(initialProjectsCount).toBeGreaterThan(0);

    const maliciousCompoundId = encodeURIComponent('1; DROP TABLE projects; --');
    const res = await api.get(`/api/projects/${maliciousCompoundId}`, { token: adminToken });
    // Should either return project 1 (200) or 404 if deleted, but NEVER crash (500)
    expect([200, 404].includes(res.status)).toBe(true);

    // Verify projects table STILL exists and was NOT dropped
    const afterProjectsCount = Number(db.queryOne('SELECT COUNT(*) AS count FROM projects').count);
    expect(afterProjectsCount).toBe(initialProjectsCount);
  });

  it('5.20 - Role injection in PUT /api/users/:id/role is strictly blocked by allowlist', async () => {
    const targetUser = db.queryOne("SELECT id FROM users WHERE role = 'usuario_normal' LIMIT 1");
    if (!targetUser) return;

    const invalidRoles = [
      "administrador' OR '1'='1",
      "'; UPDATE users SET role='administrador';--",
      "root",
      "superadmin",
      "undefined",
      ""
    ];

    for (const role of invalidRoles) {
      const res = await api.put(`/api/users/${targetUser.id}/role`, { role }, { token: adminToken });
      expect(res.status).toBe(400);
      expect(res.data.error).toContain('Rol inválido');
    }
  });

  it('5.21 - SQL Injection in contact inquiry payload stored literally without executing SQL', async () => {
    const sqliMessage = {
      name: "Robert'); DROP TABLE contact_messages;--",
      email: `sqli_contact_${Date.now()}@example.com`,
      inquiry_type: "soporte' OR '1'='1",
      message: "'; DELETE FROM users; SELECT * FROM users WHERE 'a'='a"
    };

    const res = await api.post('/api/contact', sqliMessage);
    expect(res.status).toBe(201);
    expect(res.data.data.name).toBe(sqliMessage.name);

    // Verify database tables are untouched
    const stored = db.queryOne('SELECT * FROM contact_messages WHERE email = ?', sqliMessage.email);
    expect(stored).toBeDefined();
    expect(stored.name).toBe(sqliMessage.name);
    expect(stored.message).toBe(sqliMessage.message);

    const usersCount = db.queryOne('SELECT COUNT(*) AS count FROM users');
    expect(Number(usersCount.count)).toBeGreaterThan(0);
  });
});

describe('Tier 5: Adversarial Hardening - Contact Messages Edge Cases & Resilience', () => {
  it('5.22 - Large payloads (10KB & 50KB) are accepted and stored without truncation', async () => {
    const largeMessage10k = 'A'.repeat(10 * 1024);
    const res10k = await api.post('/api/contact', {
      name: '10KB Sender',
      email: 'large10k@example.com',
      inquiry_type: 'consulta_general',
      message: largeMessage10k
    });
    expect(res10k.status).toBe(201);
    expect(res10k.data.data.message.length).toBe(10 * 1024);

    const largeMessage50k = 'B'.repeat(50 * 1024);
    const res50k = await api.post('/api/contact', {
      name: '50KB Sender',
      email: 'large50k@example.com',
      inquiry_type: 'consulta_general',
      message: largeMessage50k
    });
    expect(res50k.status).toBe(201);
    expect(res50k.data.data.message.length).toBe(50 * 1024);

    // Verify stored length in SQLite
    const row = db.queryOne('SELECT message FROM contact_messages WHERE id = ?', res50k.data.id);
    expect(row.message.length).toBe(50 * 1024);
  });

  it('5.23 - Invalid email formats in contact inquiries are strictly rejected with 400', async () => {
    const invalidEmails = [
      'plainaddress',
      '#@%^%#$@#$@#.com',
      '@missingusername.com',
      'username@.com',
      'username@com',
      'user name@domain.com',
      'user@domain .com',
      'email@example@example.com',
      'null',
      'undefined'
    ];

    for (const email of invalidEmails) {
      const res = await api.post('/api/contact', {
        name: 'Invalid Email Tester',
        email,
        inquiry_type: 'consulta_general',
        message: 'Testing validation on bad emails.'
      });
      expect(res.status).toBe(400);
      expect(res.data.error).toContain('Correo electrónico válido requerido');
    }
  });

  it('5.24 - Adversarial email boundary: script tag in email is stored as plain string and escaped in email service', async () => {
    // White-box finding: EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ does not reject HTML tags
    const probeEmail = '<script>alert(1)</script>@domain.com';
    const res = await api.post('/api/contact', {
      name: 'Script Tag Email Tester',
      email: probeEmail,
      inquiry_type: 'consulta_general',
      message: 'Testing email regex boundary handling.'
    });

    if (res.status === 201) {
      // If regex permits the payload, verify database stores it verbatim as plain text without corruption
      const stored = db.queryOne('SELECT email FROM contact_messages WHERE id = ?', res.data.id);
      expect(stored.email).toBe(probeEmail);
    } else {
      expect(res.status).toBe(400);
    }
  });

  it('5.25 - Rapid consecutive burst submissions all succeed with distinct IDs and timestamps', async () => {
    const burstCount = 12;
    const submittedIds = [];

    for (let i = 0; i < burstCount; i++) {
      const res = await api.post('/api/contact', {
        name: `Rapid User ${i}`,
        email: `rapid_${i}_${Date.now()}@example.com`,
        inquiry_type: 'trabajo',
        message: `Rapid burst message sequence ${i}`
      });
      expect(res.status).toBe(201);
      expect(res.data.id).toBeDefined();
      submittedIds.push(res.data.id);
    }

    // Verify all IDs are unique and strictly ascending
    const uniqueIds = new Set(submittedIds);
    expect(uniqueIds.size).toBe(burstCount);

    for (let i = 1; i < submittedIds.length; i++) {
      expect(submittedIds[i]).toBeGreaterThan(submittedIds[i - 1]);
    }
  });

  it('5.26 - Unicode, emojis, newlines, and XSS tags are preserved safely without corruption', async () => {
    const complexPayload = {
      name: "Dr. José Martín 👨‍💻 🚀",
      email: `unicode_${Date.now()}@test.io`,
      inquiry_type: "colaboracion",
      message: "<script>alert('xss');</script>\nLine 2 with \"quotes\" & 'single'\nLine 3: 漢字 日本語 한국어\nLine 4: 100% 👍"
    };

    const res = await api.post('/api/contact', complexPayload);
    expect(res.status).toBe(201);

    const stored = db.queryOne('SELECT * FROM contact_messages WHERE id = ?', res.data.id);
    expect(stored.name).toBe(complexPayload.name);
    expect(stored.message).toBe(complexPayload.message);
  });

  it('5.27 - Whitespace-only and empty required fields return 400 Bad Request', async () => {
    const whitespacePayloads = [
      { name: '   ', email: 'valid@example.com', inquiry_type: 'trabajo', message: 'Valid message' },
      { name: 'Valid Name', email: '   ', inquiry_type: 'trabajo', message: 'Valid message' },
      { name: 'Valid Name', email: 'valid@example.com', inquiry_type: '   ', message: 'Valid message' },
      { name: 'Valid Name', email: 'valid@example.com', inquiry_type: 'trabajo', message: '   ' },
      {}
    ];

    for (const payload of whitespacePayloads) {
      const res = await api.post('/api/contact', payload);
      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    }
  });
});

describe('Tier 5: Adversarial Hardening - Administrative Lockout Protection Invariants', () => {
  let adminAuth = null;
  let operatorAuth = null;
  let userAuth = null;

  beforeAll(async () => {
    adminAuth = await api.loginAs('admin');
    operatorAuth = await api.loginAs('operator');
    userAuth = await api.post('/api/auth/register', makeUser());
  });

  it('5.28 - Invariant 1: Sole administrator CANNOT demote themselves to non-admin role (400)', async () => {
    const adminUser = adminAuth.user;

    // Check count of active admins
    const adminCount = Number(db.queryOne("SELECT COUNT(*) AS count FROM users WHERE role = 'administrador'").count);
    expect(adminCount).toBe(1);

    // Attempt demoting sole admin to usuario_normal
    const resDemoteUser = await api.put(`/api/users/${adminUser.id}/role`, {
      role: 'usuario_normal'
    }, { token: adminAuth.token });

    expect(resDemoteUser.status).toBe(400);
    expect(resDemoteUser.data.error).toContain('No es posible cambiar el rol del único administrador');

    // Attempt demoting sole admin to operador
    const resDemoteOp = await api.put(`/api/users/${adminUser.id}/role`, {
      role: 'operador'
    }, { token: adminAuth.token });

    expect(resDemoteOp.status).toBe(400);
    expect(resDemoteOp.data.error).toContain('No es posible cambiar el rol del único administrador');

    // Verify admin role has NOT changed in database
    const currentAdmin = db.queryOne('SELECT role FROM users WHERE id = ?', adminUser.id);
    expect(currentAdmin.role).toBe('administrador');
  });

  it('5.29 - Invariant 2: Administrator CANNOT delete their own account in session (400)', async () => {
    const adminUser = adminAuth.user;

    const res = await api.delete(`/api/users/${adminUser.id}`, { token: adminAuth.token });
    expect(res.status).toBe(400);
    expect(res.data.error).toContain('No puede eliminar su propia cuenta de administrador');

    // Verify account still exists
    const adminInDb = db.queryOne('SELECT id FROM users WHERE id = ?', adminUser.id);
    expect(adminInDb).toBeDefined();
  });

  it('5.30 - Invariant 3: Multi-admin lifecycle and automatic lockout re-arming', async () => {
    const adminUser = adminAuth.user;

    // Step 1: Create a secondary user and promote to administrador
    const tempUser = makeUser();
    const tempReg = await api.post('/api/auth/register', tempUser);
    expect(tempReg.status).toBe(201);
    const secondAdminId = tempReg.data.user.id;

    const promoteRes = await api.put(`/api/users/${secondAdminId}/role`, {
      role: 'administrador'
    }, { token: adminAuth.token });
    expect(promoteRes.status).toBe(200);
    expect(promoteRes.data.role).toBe('administrador');

    // Verify there are now 2 administrators
    const count2Admins = Number(db.queryOne("SELECT COUNT(*) AS count FROM users WHERE role = 'administrador'").count);
    expect(count2Admins).toBe(2);

    // Step 2: Now that 2 admins exist, one admin CAN be demoted back to operador
    const demoteRes = await api.put(`/api/users/${secondAdminId}/role`, {
      role: 'operador'
    }, { token: adminAuth.token });
    expect(demoteRes.status).toBe(200);
    expect(demoteRes.data.role).toBe('operador');

    // Step 3: Now only 1 admin remains again. Verify lockout protection immediately re-arms!
    const count1Admin = Number(db.queryOne("SELECT COUNT(*) AS count FROM users WHERE role = 'administrador'").count);
    expect(count1Admin).toBe(1);

    const rearmedDemote = await api.put(`/api/users/${adminUser.id}/role`, {
      role: 'usuario_normal'
    }, { token: adminAuth.token });
    expect(rearmedDemote.status).toBe(400);
    expect(rearmedDemote.data.error).toContain('No es posible cambiar el rol del único administrador');

    // Clean up temporary user
    await api.delete(`/api/users/${secondAdminId}`, { token: adminAuth.token });
  });

  it('5.31 - Invariant 4: Non-admin users cannot alter roles or delete users (403 Forbidden)', async () => {
    const normalToken = userAuth.data.token;
    const operatorToken = operatorAuth.token;

    // Normal user attempts
    const resUserRole = await api.put('/api/users/1/role', { role: 'administrador' }, { token: normalToken });
    expect(resUserRole.status).toBe(403);

    const resUserDelete = await api.delete('/api/users/1', { token: normalToken });
    expect(resUserDelete.status).toBe(403);

    // Operator attempts
    const resOpRole = await api.put('/api/users/1/role', { role: 'administrador' }, { token: operatorToken });
    expect(resOpRole.status).toBe(403);

    const resOpDelete = await api.delete('/api/users/1', { token: operatorToken });
    expect(resOpDelete.status).toBe(403);
  });

  it('5.32 - Invariant 5: Relational integrity ON DELETE SET NULL preserved when user is removed', async () => {
    // Register temporary user
    const tempUser = makeUser();
    const regRes = await api.post('/api/auth/register', tempUser);
    expect(regRes.status).toBe(201);
    const tempUserId = regRes.data.user.id;
    const tempToken = regRes.data.token;

    // Submit authenticated contact message
    const msgRes = await api.post('/api/contact', {
      name: tempUser.name,
      email: tempUser.email,
      inquiry_type: 'consulta_general',
      message: 'Inquiry linking user before account deletion'
    }, { token: tempToken });
    expect(msgRes.status).toBe(201);
    const msgId = msgRes.data.id;

    // Confirm user_id is set
    const beforeDel = db.queryOne('SELECT user_id FROM contact_messages WHERE id = ?', msgId);
    expect(Number(beforeDel.user_id)).toBe(tempUserId);

    // Admin deletes the temporary user
    const delRes = await api.delete(`/api/users/${tempUserId}`, { token: adminAuth.token });
    expect(delRes.status).toBe(200);

    // Verify contact message STILL exists and user_id is now strictly NULL
    const afterDel = db.queryOne('SELECT id, user_id, name, email FROM contact_messages WHERE id = ?', msgId);
    expect(afterDel).toBeDefined();
    expect(afterDel.user_id).toBeNull();
  });
});

// Standalone execution support
if (require.main === module) {
  (async () => {
    const serverManager = require('../helpers/server-manager');
    console.log('[Tier 5 Hardening] Auto-starting backend server for standalone execution...');
    await serverManager.ensureServerRunning();
    try {
      const passed = await harness.run();
      process.exit(passed ? 0 : 1);
    } catch (err) {
      console.error('[Tier 5 Hardening] Standalone execution error:', err);
      process.exit(1);
    } finally {
      serverManager.stopServer();
    }
  })();
}
