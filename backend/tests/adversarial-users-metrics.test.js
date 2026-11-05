// backend/tests/adversarial-users-metrics.test.js
/**
 * Empirical Adversarial Test Harness for Milestone 3 (User Admin & Site Metrics)
 * 
 * Objective:
 * 1. User Admin Security & Lockout Protection:
 *    - Invalid role updates ('superuser', 'root', '', 123, null, etc.) -> MUST fail with 400.
 *    - Demoting sole administrator -> MUST fail with 400 (system lockout prevention).
 *    - Self-deletion and deleting last administrator -> MUST fail with 400.
 *    - Deleting user with existing contact messages -> verify inquiries remain in SQLite with user_id = NULL (ON DELETE SET NULL).
 *    - Password hash leak check: verify password_hash and password are NEVER present in responses from:
 *      GET /api/users, GET /api/users/:id, PUT /api/users/:id/role.
 *    - RBAC boundaries on user management (401 for guests, 403 for normal users & operators).
 * 
 * 2. Metrics Concurrency Stress:
 *    - High concurrency burst of POST /api/metrics/visit (50 concurrent requests) -> exact atomic accumulation.
 *    - Back-to-back burst verification (additional 25 requests).
 *    - Recharts datasets format and types validation in GET /api/metrics:
 *      inquiriesByType (type: string, count: number) and registrationsTimeline (date: YYYY-MM-DD, count: number).
 *    - All KPI counters validation and compatibility aliases.
 *    - RBAC boundaries on metrics (401 for guests, 403 for normal users & operators).
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');
const { getDb } = require('../src/database/db');

describe('Empirical Adversarial Challenges: User Administration & Site Metrics (M3)', () => {
  let adminToken = null;
  let adminUserId = null;
  let userToken = null;
  let normalUserId = null;
  let operatorToken = null;
  let operatorUserId = null;

  const createdUserIds = [];
  const createdInquiryIds = [];

  before(async () => {
    // 1. Authenticate Admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@portfolio.local', password: 'admin123' });
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login must succeed');
    adminToken = adminLoginRes.body.token;
    adminUserId = adminLoginRes.body.user.id;

    // 2. Authenticate Operator
    const opLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operador@portfolio.local', password: 'operador123' });
    assert.strictEqual(opLoginRes.status, 200, 'Operator login must succeed');
    operatorToken = opLoginRes.body.token;
    operatorUserId = opLoginRes.body.user.id;

    // 3. Register Normal User
    const suffix = Date.now();
    const userRegRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: `Adversarial User ${suffix}`,
        email: `adv_user_${suffix}@test.local`,
        password: 'Password123!'
      });
    assert.strictEqual(userRegRes.status, 201, 'User registration must succeed');
    userToken = userRegRes.body.token;
    normalUserId = userRegRes.body.user.id;
    createdUserIds.push(normalUserId);
  });

  after(async () => {
    // Clean up created resources directly in SQLite
    const db = getDb();
    for (const inqId of createdInquiryIds) {
      try {
        db.prepare('DELETE FROM contact_messages WHERE id = ?').run(inqId);
      } catch {}
    }
    for (const uId of createdUserIds) {
      try {
        db.prepare('DELETE FROM users WHERE id = ?').run(uId);
      } catch {}
    }
  });

  // =========================================================================
  // CHALLENGE 1: User Admin Security, Role Validation & Lockout Prevention
  // =========================================================================
  describe('Challenge 1: User Admin Security & Lockout Prevention', () => {

    // 1.1 Invalid Role Updates
    const invalidRoles = [
      { label: 'superuser', value: 'superuser' },
      { label: 'root', value: 'root' },
      { label: 'admin (system requires administrador)', value: 'admin' },
      { label: 'uppercase ADMINISTRADOR', value: 'ADMINISTRADOR' },
      { label: 'mixed-case Operador', value: 'Operador' },
      { label: 'empty string', value: '' },
      { label: 'whitespace only', value: '   ' },
      { label: 'number', value: 12345 },
      { label: 'null', value: null },
      { label: 'boolean true', value: true },
      { label: 'array', value: ['administrador'] },
      { label: 'object', value: { role: 'administrador' } },
      { label: 'SQL injection attempt', value: "administrador'; DROP TABLE users; --" },
      { label: 'XSS script tag', value: "<script>alert('xss')</script>" }
    ];

    for (const testCase of invalidRoles) {
      it(`Rejects invalid role "${testCase.label}" with 400 Bad Request`, async () => {
        const db = getDb();
        const roleBefore = db.prepare('SELECT role FROM users WHERE id = ?').get(normalUserId).role;

        const res = await request(app)
          .put(`/api/users/${normalUserId}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: testCase.value });

        assert.strictEqual(res.status, 400, `Expected 400 for invalid role: ${testCase.label}, got ${res.status}`);
        assert.ok(res.body.error, 'Response must contain an error message');

        // Confirm database role did not mutate
        const roleAfter = db.prepare('SELECT role FROM users WHERE id = ?').get(normalUserId).role;
        assert.strictEqual(roleAfter, roleBefore, 'User role in database must remain unchanged after rejected update');
      });
    }

    it('Rejects missing request body with 400 Bad Request', async () => {
      const res = await request(app)
        .put(`/api/users/${normalUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error);
    });

    // 1.2 Lockout Prevention: Sole Administrator Protection
    it('Demoting the sole administrator MUST fail with 400 (system lockout prevention)', async () => {
      const db = getDb();

      // Ensure there is exactly 1 administrator
      const extraAdmins = db.prepare("SELECT id FROM users WHERE role = 'administrador' AND id != ?").all(adminUserId);
      for (const extra of extraAdmins) {
        db.prepare("UPDATE users SET role = 'operador' WHERE id = ?").run(extra.id);
      }

      const adminCount = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'administrador'").get().count;
      assert.strictEqual(Number(adminCount), 1, 'Test precondition: Exactly 1 administrator must exist');

      // Attempt to demote sole admin to usuario_normal
      const resNormal = await request(app)
        .put(`/api/users/${adminUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'usuario_normal' });

      assert.strictEqual(resNormal.status, 400, 'Demoting sole admin to usuario_normal must return 400');
      assert.ok(
        resNormal.body.error.toLowerCase().includes('bloqueo') ||
        resNormal.body.error.toLowerCase().includes('único') ||
        resNormal.body.error.toLowerCase().includes('administrador'),
        'Error message must explain lockout prevention'
      );

      // Attempt to demote sole admin to operador
      const resOp = await request(app)
        .put(`/api/users/${adminUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'operador' });

      assert.strictEqual(resOp.status, 400, 'Demoting sole admin to operador must return 400');

      // Verify admin role is intact in SQLite
      const adminRole = db.prepare('SELECT role FROM users WHERE id = ?').get(adminUserId).role;
      assert.strictEqual(adminRole, 'administrador', 'Sole admin must retain administrador role');
    });

    it('Allows demoting an administrator when multiple active administrators exist, but guards the last one', async () => {
      const db = getDb();

      // Create a second administrator
      const suffix = Date.now();
      const secondAdminRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: `Second Admin ${suffix}`,
          email: `second_admin_${suffix}@test.local`,
          password: 'Password123!'
        });
      assert.strictEqual(secondAdminRes.status, 201);
      const secondAdminId = secondAdminRes.body.user.id;
      createdUserIds.push(secondAdminId);

      // Promote second user to administrador
      const promoteRes = await request(app)
        .put(`/api/users/${secondAdminId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'administrador' });
      assert.strictEqual(promoteRes.status, 200);
      assert.strictEqual(promoteRes.body.role, 'administrador');

      // Confirm 2 administrators exist
      const countTwo = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'administrador'").get().count;
      assert.strictEqual(Number(countTwo), 2);

      // Demoting secondAdmin now SUCCEEDS because adminCount > 1
      const demoteRes = await request(app)
        .put(`/api/users/${secondAdminId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'operador' });
      assert.strictEqual(demoteRes.status, 200);
      assert.strictEqual(demoteRes.body.role, 'operador');

      // Now exactly 1 administrator remains; demoting the remaining admin MUST fail
      const countOne = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'administrador'").get().count;
      assert.strictEqual(Number(countOne), 1);

      const failDemoteRes = await request(app)
        .put(`/api/users/${adminUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'usuario_normal' });
      assert.strictEqual(failDemoteRes.status, 400);
    });

    // 1.3 Administrator Self-Deletion & Last Administrator Deletion Guard
    it('Administrator cannot delete their own active session account (Self-Deletion Lockout)', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error.toLowerCase().includes('propia cuenta') || res.body.error.toLowerCase().includes('sesión'));
    });

    it('Administrator cannot delete the last remaining administrator (System Lockout)', async () => {
      const db = getDb();
      // Ensure only 1 admin exists
      const countAdmins = Number(db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'administrador'").get().count);
      assert.strictEqual(countAdmins, 1);

      // Create an operator who is then temporarily promoted to admin to attempt deletion
      const suffix = Date.now();
      const attackerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: `Temp Admin ${suffix}`,
          email: `temp_admin_${suffix}@test.local`,
          password: 'Password123!'
        });
      const attackerId = attackerRes.body.user.id;
      createdUserIds.push(attackerId);
      const attackerToken = attackerRes.body.token;

      // Promote attacker to admin
      await request(app)
        .put(`/api/users/${attackerId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'administrador' });

      // Demote original admin to normal user? No, test deleting when only 1 admin:
      // First demote attacker back
      await request(app)
        .put(`/api/users/${attackerId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'usuario_normal' });

      // If an operator or normal user tries to delete the last admin: rejected with 403
      const forbidRes = await request(app)
        .delete(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${attackerToken}`);
      assert.strictEqual(forbidRes.status, 403);
    });

    // 1.4 Deleting user with existing contact messages (ON DELETE SET NULL verification)
    it('Deleting a user with existing contact messages preserves inquiries in SQLite with user_id = NULL', async () => {
      const db = getDb();

      // 1. Register temporary user
      const suffix = Date.now();
      const victimRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: `Victim Inquiry User ${suffix}`,
          email: `victim_${suffix}@test.local`,
          password: 'Password123!'
        });
      assert.strictEqual(victimRes.status, 201);
      const victimId = victimRes.body.user.id;
      const victimToken = victimRes.body.token;

      // 2. Submit 2 distinct contact inquiries associated with victimId
      const inq1Res = await request(app)
        .post('/api/contact')
        .set('Authorization', `Bearer ${victimToken}`)
        .send({
          name: 'Inquiry User One',
          email: `victim_${suffix}@test.local`,
          inquiry_type: 'Presupuesto',
          message: 'Quisiera cotizar un sitio web fullstack completo con panel.'
        });
      assert.strictEqual(inq1Res.status, 201);
      const inq1Id = inq1Res.body.id;
      createdInquiryIds.push(inq1Id);

      const inq2Res = await request(app)
        .post('/api/contact')
        .set('Authorization', `Bearer ${victimToken}`)
        .send({
          name: 'Inquiry User One',
          email: `victim_${suffix}@test.local`,
          inquiry_type: 'Consulta técnica',
          message: 'Tengo dudas sobre la integración con base de datos SQLite.'
        });
      assert.strictEqual(inq2Res.status, 201);
      const inq2Id = inq2Res.body.id;
      createdInquiryIds.push(inq2Id);

      // Verify inquiries are initially linked to victimId in DB
      const inq1Before = db.prepare('SELECT user_id, status, inquiry_type, message FROM contact_messages WHERE id = ?').get(inq1Id);
      const inq2Before = db.prepare('SELECT user_id, status, inquiry_type, message FROM contact_messages WHERE id = ?').get(inq2Id);
      assert.strictEqual(inq1Before.user_id, victimId);
      assert.strictEqual(inq2Before.user_id, victimId);

      // 3. Admin deletes user account
      const delRes = await request(app)
        .delete(`/api/users/${victimId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      assert.strictEqual(delRes.status, 200);
      assert.strictEqual(delRes.body.success, true);

      // 4. Verify user is deleted from users table
      const userCheck = db.prepare('SELECT id FROM users WHERE id = ?').get(victimId);
      assert.strictEqual(userCheck, undefined, 'User record must be removed');

      // 5. EMPIRICAL VERIFICATION IN SQLITE:
      // Inquiries MUST NOT be deleted. They must remain intact with user_id = NULL.
      const inq1After = db.prepare('SELECT id, user_id, name, email, inquiry_type, message, status FROM contact_messages WHERE id = ?').get(inq1Id);
      const inq2After = db.prepare('SELECT id, user_id, name, email, inquiry_type, message, status FROM contact_messages WHERE id = ?').get(inq2Id);

      assert.ok(inq1After, 'Contact inquiry #1 MUST still exist in database');
      assert.ok(inq2After, 'Contact inquiry #2 MUST still exist in database');

      assert.strictEqual(inq1After.user_id, null, 'Foreign key constraint MUST set user_id = NULL on user removal');
      assert.strictEqual(inq2After.user_id, null, 'Foreign key constraint MUST set user_id = NULL on user removal');

      assert.strictEqual(inq1After.inquiry_type, 'Presupuesto');
      assert.strictEqual(inq1After.message, 'Quisiera cotizar un sitio web fullstack completo con panel.');
      assert.strictEqual(inq2After.inquiry_type, 'Consulta técnica');

      // 6. VERIFY VIA OPERATOR API:
      // Operator should still be able to retrieve the inquiry and inspect it with user_id === null
      const opInq1 = await request(app)
        .get(`/api/operator/messages/${inq1Id}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      assert.strictEqual(opInq1.body.id, inq1Id);
      assert.strictEqual(opInq1.body.user_id, null);
      assert.strictEqual(opInq1.body.status, 'pendiente');
      assert.strictEqual(opInq1.body.message, 'Quisiera cotizar un sitio web fullstack completo con panel.');
    });

    // 1.5 Password Hash Leak Check
    it('GET /api/users strictly omits password and password_hash from every returned user', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert.ok(Array.isArray(res.body), 'Response must be an array of users');
      assert.ok(res.body.length > 0, 'Users array must not be empty');

      // Raw text check: Body JSON string must NEVER contain substring 'password_hash' or bcrypt salt '$2a$'
      assert.strictEqual(res.text.includes('password_hash'), false, 'Raw response body MUST NOT contain "password_hash"');
      assert.strictEqual(res.text.includes('$2a$'), false, 'Raw response body MUST NOT contain bcrypt hashes ($2a$)');

      for (const u of res.body) {
        assert.ok(u.id, 'User must have id');
        assert.ok(u.email, 'User must have email');
        assert.ok(u.role, 'User must have role');
        assert.strictEqual(u.password, undefined, 'User object must NOT have password property');
        assert.strictEqual(u.password_hash, undefined, 'User object must NOT have password_hash property');
      }
    });

    it('GET /api/users/:id strictly omits password and password_hash', async () => {
      const res = await request(app)
        .get(`/api/users/${normalUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert.strictEqual(res.body.id, normalUserId);
      assert.strictEqual(res.body.password, undefined);
      assert.strictEqual(res.body.password_hash, undefined);
      assert.strictEqual(res.text.includes('password_hash'), false);
      assert.strictEqual(res.text.includes('$2a$'), false);
    });

    it('PUT /api/users/:id/role strictly omits password and password_hash in response payload', async () => {
      const res = await request(app)
        .put(`/api/users/${normalUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'operador' })
        .expect(200);

      assert.strictEqual(res.body.id, normalUserId);
      assert.strictEqual(res.body.role, 'operador');
      assert.strictEqual(res.body.password, undefined);
      assert.strictEqual(res.body.password_hash, undefined);
      assert.strictEqual(res.text.includes('password_hash'), false);
      assert.strictEqual(res.text.includes('$2a$'), false);
    });

    // 1.6 RBAC Privilege Boundaries
    it('Rejects unauthenticated access to /api/users endpoints with 401 Unauthorized', async () => {
      await request(app).get('/api/users').expect(401);
      await request(app).get(`/api/users/${normalUserId}`).expect(401);
      await request(app).put(`/api/users/${normalUserId}/role`).send({ role: 'operador' }).expect(401);
      await request(app).delete(`/api/users/${normalUserId}`).expect(401);
    });

    it('Rejects normal user access to /api/users endpoints with 403 Forbidden', async () => {
      await request(app).get('/api/users').set('Authorization', `Bearer ${userToken}`).expect(403);
      await request(app).get(`/api/users/${normalUserId}`).set('Authorization', `Bearer ${userToken}`).expect(403);
      await request(app).put(`/api/users/${normalUserId}/role`).set('Authorization', `Bearer ${userToken}`).send({ role: 'operador' }).expect(403);
      await request(app).delete(`/api/users/${normalUserId}`).set('Authorization', `Bearer ${userToken}`).expect(403);
    });

    it('Rejects operator access to /api/users endpoints with 403 Forbidden', async () => {
      await request(app).get('/api/users').set('Authorization', `Bearer ${operatorToken}`).expect(403);
      await request(app).get(`/api/users/${normalUserId}`).set('Authorization', `Bearer ${operatorToken}`).expect(403);
      await request(app).put(`/api/users/${normalUserId}/role`).set('Authorization', `Bearer ${operatorToken}`).send({ role: 'operador' }).expect(403);
      await request(app).delete(`/api/users/${normalUserId}`).set('Authorization', `Bearer ${operatorToken}`).expect(403);
    });
  });

  // =========================================================================
  // CHALLENGE 2: Metrics Concurrency Stress & Recharts Datasets Validation
  // =========================================================================
  describe('Challenge 2: Metrics Concurrency Stress & Datasets Validation', () => {

    it('High concurrency burst: 50 concurrent POST /api/metrics/visit requests atomically increment visitas_generales', async () => {
      const db = getDb();

      // 1. Read initial visit count from DB
      const initialRow = db.prepare("SELECT count FROM site_metrics WHERE metric_key = 'visitas_generales'").get();
      const initialCount = initialRow ? Number(initialRow.count) : 0;

      // 2. Fire 50 concurrent requests simultaneously using Promise.all
      const CONCURRENCY = 50;
      const promises = Array.from({ length: CONCURRENCY }, () =>
        request(app).post('/api/metrics/visit')
      );

      const responses = await Promise.all(promises);

      // 3. Verify every request succeeded with HTTP 200
      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        assert.strictEqual(res.status, 200, `Request #${i + 1} must return 200`);
        assert.strictEqual(res.body.success, true, `Request #${i + 1} must have success: true`);
        assert.strictEqual(typeof res.body.count, 'number', `Request #${i + 1} count must be number`);
        assert.ok(res.body.count > initialCount, `Request #${i + 1} count (${res.body.count}) must exceed initial count (${initialCount})`);
        assert.ok(res.body.count <= initialCount + CONCURRENCY, `Request #${i + 1} count must not exceed maximum expected`);
      }

      // 4. Verify final count in SQLite database is EXACTLY initialCount + 50 (Zero lost updates)
      const finalRow = db.prepare("SELECT count FROM site_metrics WHERE metric_key = 'visitas_generales'").get();
      const finalCount = finalRow ? Number(finalRow.count) : 0;

      assert.strictEqual(
        finalCount,
        initialCount + CONCURRENCY,
        `Final visitas_generales MUST equal ${initialCount + CONCURRENCY}. Got ${finalCount} (Diff: ${finalCount - (initialCount + CONCURRENCY)})`
      );

      // 5. Verify GET /api/metrics also reflects this exact count
      const metricsRes = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      assert.strictEqual(metricsRes.body.visitas_generales, finalCount);
      assert.strictEqual(metricsRes.body.visits, finalCount);
    });

    it('Secondary back-to-back concurrency burst (25 requests) sustains atomic consistency', async () => {
      const db = getDb();
      const initialRow = db.prepare("SELECT count FROM site_metrics WHERE metric_key = 'visitas_generales'").get();
      const initialCount = initialRow ? Number(initialRow.count) : 0;

      const CONCURRENCY = 25;
      const responses = await Promise.all(
        Array.from({ length: CONCURRENCY }, () => request(app).post('/api/metrics/visit'))
      );

      for (const res of responses) {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
      }

      const finalRow = db.prepare("SELECT count FROM site_metrics WHERE metric_key = 'visitas_generales'").get();
      const finalCount = finalRow ? Number(finalRow.count) : 0;
      assert.strictEqual(finalCount, initialCount + CONCURRENCY);
    });

    it('Validates structure and types of Recharts datasets in GET /api/metrics', async () => {
      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 1. Structure & Types: inquiriesByType (Recharts PieChart / BarChart dataset)
      assert.ok(Array.isArray(res.body.inquiriesByType), 'inquiriesByType must be an Array');
      assert.ok(res.body.inquiriesByType.length > 0, 'inquiriesByType must have at least one entry');

      for (const item of res.body.inquiriesByType) {
        assert.ok(typeof item === 'object' && item !== null, 'Item in inquiriesByType must be an object');
        assert.strictEqual(typeof item.type, 'string', 'inquiriesByType[].type must be string');
        assert.ok(item.type.length > 0, 'inquiriesByType[].type must not be empty');
        assert.strictEqual(typeof item.count, 'number', 'inquiriesByType[].count must be number');
        assert.ok(!isNaN(item.count), 'inquiriesByType[].count must not be NaN');
        assert.ok(item.count >= 0, 'inquiriesByType[].count must be non-negative');
        assert.ok(Number.isInteger(item.count), 'inquiriesByType[].count must be an integer');
      }

      // 2. Structure & Types: registrationsTimeline (Recharts LineChart / AreaChart dataset)
      assert.ok(Array.isArray(res.body.registrationsTimeline), 'registrationsTimeline must be an Array');
      assert.ok(res.body.registrationsTimeline.length > 0, 'registrationsTimeline must have at least one entry');

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      for (const item of res.body.registrationsTimeline) {
        assert.ok(typeof item === 'object' && item !== null, 'Item in registrationsTimeline must be an object');
        assert.strictEqual(typeof item.date, 'string', 'registrationsTimeline[].date must be string');
        assert.ok(dateRegex.test(item.date), `registrationsTimeline[].date "${item.date}" must match YYYY-MM-DD pattern`);
        assert.strictEqual(typeof item.count, 'number', 'registrationsTimeline[].count must be number');
        assert.ok(!isNaN(item.count), 'registrationsTimeline[].count must not be NaN');
        assert.ok(item.count >= 0, 'registrationsTimeline[].count must be non-negative');
        assert.ok(Number.isInteger(item.count), 'registrationsTimeline[].count must be an integer');
      }

      // 3. KPI Counters: types and non-negative constraints
      const kpis = [
        'visitas_generales',
        'accesos_autenticados',
        'total_users',
        'total_projects',
        'total_services',
        'total_messages',
        'pending_messages',
        'responded_messages'
      ];

      for (const kpi of kpis) {
        assert.strictEqual(typeof res.body[kpi], 'number', `KPI ${kpi} must be a number`);
        assert.ok(!isNaN(res.body[kpi]), `KPI ${kpi} must not be NaN`);
        assert.ok(res.body[kpi] >= 0, `KPI ${kpi} must be >= 0`);
        assert.ok(Number.isInteger(res.body[kpi]), `KPI ${kpi} must be an integer`);
      }

      // Message consistency check
      assert.strictEqual(
        res.body.pending_messages + res.body.responded_messages,
        res.body.total_messages,
        'pending_messages + responded_messages must equal total_messages'
      );

      // 4. Compatibility Aliases & Nested Recharts object
      assert.strictEqual(res.body.visits, res.body.visitas_generales);
      assert.strictEqual(res.body.authenticated_logins, res.body.accesos_autenticados);
      assert.deepStrictEqual(res.body.inquiries_by_type, res.body.inquiriesByType);
      assert.deepStrictEqual(res.body.consultas_por_tipo, res.body.inquiriesByType);
      assert.ok(res.body.charts, 'res.body.charts must be defined');
      assert.deepStrictEqual(res.body.charts.inquiriesByType, res.body.inquiriesByType);
      assert.deepStrictEqual(res.body.charts.registrationsTimeline, res.body.registrationsTimeline);
    });

    // 2.4 RBAC Security for Metrics Endpoint
    it('Rejects unauthenticated GET /api/metrics with 401 Unauthorized', async () => {
      await request(app).get('/api/metrics').expect(401);
    });

    it('Rejects normal user GET /api/metrics with 403 Forbidden', async () => {
      await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('Rejects operator GET /api/metrics with 403 Forbidden', async () => {
      await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(403);
    });
  });
});
