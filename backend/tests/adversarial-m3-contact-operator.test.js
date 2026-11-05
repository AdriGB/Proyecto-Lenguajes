// backend/tests/adversarial-m3-contact-operator.test.js
/**
 * Empirical Adversarial Test Harness for Milestone 3 (Contact Messages & Operator Workflow)
 * 
 * Verifies under hostile/edge conditions:
 * 1. Contact Form Stress:
 *    - Invalid email formats, empty fields, excessively long messages (50KB payload).
 *    - Unauthenticated vs Authenticated: submit without token (user_id MUST be null in SQLite);
 *      submit with token (user_id MUST match authenticated user).
 *    - Missing fields, extra unexpected fields / mass assignment attempts.
 * 2. Operator Workflow Stress:
 *    - Non-operator accessing operator routes -> MUST return HTTP 403.
 *    - Replying to non-existent inquiry ID -> MUST return HTTP 404.
 *    - Replying with unconfigured or unreachable SMTP server -> MUST return HTTP 200 without crashing or 500.
 *    - Status updates: verify status changes to 'respondida' and responded_at is updated.
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');
const { getDb } = require('../src/database/db');
const { sendInquiryResponse } = require('../src/services/emailService');

describe('Empirical Adversarial Challenges: Contact Messages & Operator Workflow (M3)', () => {
  let adminToken = null;
  let operatorToken = null;
  let normalUserToken = null;
  let normalUserId = null;
  const createdInquiryIds = [];

  before(async () => {
    // 1. Authenticate Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@portfolio.local', password: 'admin123' });
    assert.strictEqual(adminLogin.status, 200, 'Admin login must succeed');
    adminToken = adminLogin.body.token;

    // 2. Authenticate Operator
    const opLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operador@portfolio.local', password: 'operador123' });
    assert.strictEqual(opLogin.status, 200, 'Operator login must succeed');
    operatorToken = opLogin.body.token;

    // 3. Register fresh Normal User
    const userSuffix = Date.now();
    const userReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: `Adv Contact User ${userSuffix}`,
        email: `adv_contact_${userSuffix}@test.local`,
        password: 'Password123!'
      });
    assert.strictEqual(userReg.status, 201, 'Normal user registration must succeed');
    normalUserToken = userReg.body.token;
    normalUserId = userReg.body.user.id;
    assert.ok(normalUserId, 'Normal user ID must be populated');
  });

  after(async () => {
    // Clean up created inquiries
    const db = getDb();
    for (const inqId of createdInquiryIds) {
      try {
        db.prepare('DELETE FROM contact_messages WHERE id = ?').run(inqId);
      } catch {}
    }
  });

  // =========================================================================
  // CHALLENGE 1: Contact Form Input Validation, Boundaries & Stress
  // =========================================================================
  describe('Challenge 1: Contact Form Input Validation & Stress', () => {

    it('Rejects invalid email formats with 400 Bad Request', async () => {
      const invalidEmails = [
        'plainaddress',
        '@missingusername.com',
        'username@.com',
        'spaces in@domain.com',
        'user@domain com',
        'user@',
        'user@domain',
        'user@@domain.com',
        'missing@domain',
        '@nodomain.com'
      ];

      for (const badEmail of invalidEmails) {
        const res = await request(app)
          .post('/api/contact')
          .send({
            name: 'Stress Inquirer',
            email: badEmail,
            inquiry_type: 'Presupuesto',
            message: 'Checking email validation.'
          });

        assert.strictEqual(
          res.status,
          400,
          `Expected 400 for bad email "${badEmail}", got ${res.status}`
        );
        assert.ok(res.body.error, 'Response must explain the validation error');
      }
    });

    it('Rejects empty or whitespace-only fields with 400 Bad Request', async () => {
      // Empty / whitespace name
      const resName = await request(app)
        .post('/api/contact')
        .send({
          name: '   ',
          email: 'valid@example.com',
          inquiry_type: 'Presupuesto',
          message: 'Valid message'
        });
      assert.strictEqual(resName.status, 400, 'Whitespace name must return 400');

      // Name shorter than 2 chars
      const resShortName = await request(app)
        .post('/api/contact')
        .send({
          name: 'A',
          email: 'valid@example.com',
          inquiry_type: 'Presupuesto',
          message: 'Valid message'
        });
      assert.strictEqual(resShortName.status, 400, 'Single char name must return 400');

      // Empty / whitespace inquiry_type
      const resType = await request(app)
        .post('/api/contact')
        .send({
          name: 'Valid Name',
          email: 'valid@example.com',
          inquiry_type: '   \n\t  ',
          message: 'Valid message'
        });
      assert.strictEqual(resType.status, 400, 'Whitespace inquiry_type must return 400');

      // Empty / whitespace message
      const resMsg = await request(app)
        .post('/api/contact')
        .send({
          name: 'Valid Name',
          email: 'valid@example.com',
          inquiry_type: 'Presupuesto',
          message: '     \r\n\t   '
        });
      assert.strictEqual(resMsg.status, 400, 'Whitespace message must return 400');
    });

    it('Rejects non-string and null field types with 400 Bad Request', async () => {
      const nonStringPayloads = [
        { name: 12345, email: 'test@example.com', inquiry_type: 'Presupuesto', message: 'Hello' },
        { name: 'Tester', email: 12345, inquiry_type: 'Presupuesto', message: 'Hello' },
        { name: 'Tester', email: 'test@example.com', inquiry_type: 12345, message: 'Hello' },
        { name: 'Tester', email: 'test@example.com', inquiry_type: 'Presupuesto', message: 12345 },
        { name: null, email: 'test@example.com', inquiry_type: 'Presupuesto', message: 'Hello' },
        { name: 'Tester', email: null, inquiry_type: 'Presupuesto', message: 'Hello' },
        { name: 'Tester', email: 'test@example.com', inquiry_type: null, message: 'Hello' },
        { name: 'Tester', email: 'test@example.com', inquiry_type: 'Presupuesto', message: null }
      ];

      for (const payload of nonStringPayloads) {
        const res = await request(app)
          .post('/api/contact')
          .send(payload);
        assert.strictEqual(res.status, 400, `Expected 400 for non-string/null field, got ${res.status}`);
      }
    });

    it('Rejects missing required fields and completely empty payload with 400 Bad Request', async () => {
      // Completely empty payload
      const resEmpty = await request(app)
        .post('/api/contact')
        .send({});
      assert.strictEqual(resEmpty.status, 400);

      // Missing message
      const resNoMsg = await request(app)
        .post('/api/contact')
        .send({
          name: 'Tester',
          email: 'tester@example.com',
          inquiry_type: 'Presupuesto'
        });
      assert.strictEqual(resNoMsg.status, 400);

      // Missing inquiry_type
      const resNoType = await request(app)
        .post('/api/contact')
        .send({
          name: 'Tester',
          email: 'tester@example.com',
          message: 'A message here'
        });
      assert.strictEqual(resNoType.status, 400);

      // Missing email
      const resNoEmail = await request(app)
        .post('/api/contact')
        .send({
          name: 'Tester',
          inquiry_type: 'Presupuesto',
          message: 'A message here'
        });
      assert.strictEqual(resNoEmail.status, 400);

      // Missing name
      const resNoName = await request(app)
        .post('/api/contact')
        .send({
          email: 'tester@example.com',
          inquiry_type: 'Presupuesto',
          message: 'A message here'
        });
      assert.strictEqual(resNoName.status, 400);
    });

    it('Handles excessively large message payload (50KB) gracefully and stores in SQLite without truncation', async () => {
      // 50KB string: 51,200 characters
      const largePayload = 'A'.repeat(51200);

      const res = await request(app)
        .post('/api/contact')
        .send({
          name: '50KB Stress Inquirer',
          email: 'stress50k@example.com',
          inquiry_type: 'Carga Masiva',
          message: largePayload
        });

      // Must either return 201 Created or 413 Payload Too Large, NEVER 500 crash
      assert.ok(
        [201, 413].includes(res.status),
        `Expected 201 or 413 for 50KB payload, got ${res.status}`
      );

      if (res.status === 201) {
        assert.ok(res.body.id, 'Inquiry ID returned');
        createdInquiryIds.push(res.body.id);

        // Verify in SQLite directly that the stored message matches the 51,200 chars exactly
        const db = getDb();
        const storedRow = db.prepare('SELECT message FROM contact_messages WHERE id = ?').get(res.body.id);
        assert.ok(storedRow, 'Record must exist in SQLite database');
        assert.strictEqual(
          storedRow.message.length,
          51200,
          'SQLite stored message must contain all 51,200 characters without truncation'
        );
      }
    });

    it('Extra unexpected fields and privilege spoofing attempts are safely neutralized', async () => {
      const maliciousPayload = {
        name: 'Attacker Inquirer',
        email: 'attacker@example.com',
        inquiry_type: 'Inyección de Parámetros',
        message: 'Intento de modificar status o suplantar user_id.',
        status: 'respondida',                 // Attempt to bypass pending status
        response_message: 'Injected Response', // Attempt to pre-fill response
        responded_at: '2020-01-01 00:00:00',   // Attempt to pre-fill responded_at
        user_id: 1,                            // Attempt to spoof admin user_id as guest
        role: 'administrador',                 // Irrelevant field
        hacked: true                           // Arbitrary field
      };

      const res = await request(app)
        .post('/api/contact')
        .send(maliciousPayload)
        .expect(201);

      assert.ok(res.body.id);
      createdInquiryIds.push(res.body.id);

      // Verify in SQLite directly:
      const db = getDb();
      const stored = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(res.body.id);

      assert.strictEqual(stored.status, 'pendiente', 'Status MUST be "pendiente", ignoring malicious input');
      assert.strictEqual(stored.response_message, null, 'response_message MUST be null initially');
      assert.strictEqual(stored.responded_at, null, 'responded_at MUST be null initially');
      assert.strictEqual(stored.user_id, null, 'user_id MUST be null when unauthenticated, ignoring spoofed user_id in body');
    });

    it('Neutralizes SQL injection payloads in contact form fields without corrupting database', async () => {
      const db = getDb();
      const messagesCountBefore = db.prepare('SELECT COUNT(*) as count FROM contact_messages').get().count;

      const sqliPayload = {
        name: "'; DROP TABLE contact_messages; --",
        email: "sqli_test@example.com",
        inquiry_type: "' OR 1=1; --",
        message: "'); DELETE FROM users; --"
      };

      const res = await request(app)
        .post('/api/contact')
        .send(sqliPayload)
        .expect(201);

      createdInquiryIds.push(res.body.id);

      // Database tables must still exist and count must have increased by 1
      const messagesCountAfter = db.prepare('SELECT COUNT(*) as count FROM contact_messages').get().count;
      assert.strictEqual(messagesCountAfter, messagesCountBefore + 1, 'Records count must increment safely');

      // Check users table still exists and intact
      const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      assert.ok(usersCount > 0, 'Users table MUST remain intact after SQL injection payload');

      // Check that the strings were saved literally
      const stored = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(res.body.id);
      assert.strictEqual(stored.name, "'; DROP TABLE contact_messages; --");
      assert.strictEqual(stored.inquiry_type, "' OR 1=1; --");
      assert.strictEqual(stored.message, "'); DELETE FROM users; --");
    });
  });

  // =========================================================================
  // CHALLENGE 2: Unauthenticated vs Authenticated Inquiries & DB Verification
  // =========================================================================
  describe('Challenge 2: Unauthenticated vs Authenticated Inquiries & DB Integrity', () => {

    it('Unauthenticated submission: user_id is strictly null in response and in SQLite', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({
          name: 'Invitado Anónimo',
          email: 'anonimo@example.com',
          inquiry_type: 'Consulta General',
          message: 'Consulta realizada sin sesión.'
        })
        .expect(201);

      assert.strictEqual(res.body.user_id, null, 'API response must return user_id: null for guest');
      createdInquiryIds.push(res.body.id);

      // Verify directly in SQLite
      const db = getDb();
      const row = db.prepare('SELECT user_id, status FROM contact_messages WHERE id = ?').get(res.body.id);
      assert.ok(row, 'Row must exist in SQLite');
      assert.strictEqual(row.user_id, null, 'SQLite user_id MUST be null for guest inquiries');
      assert.strictEqual(row.status, 'pendiente');
    });

    it('Authenticated submission: user_id strictly matches authenticated user in response and in SQLite', async () => {
      const res = await request(app)
        .post('/api/contact')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({
          name: 'Usuario Conectado',
          email: 'conectado@test.local',
          inquiry_type: 'Soporte Técnico',
          message: 'Consulta enviada con token de autenticación válido.'
        })
        .expect(201);

      assert.strictEqual(res.body.user_id, normalUserId, 'API response user_id must match authenticated user');
      createdInquiryIds.push(res.body.id);

      // Verify directly in SQLite
      const db = getDb();
      const row = db.prepare('SELECT user_id, status FROM contact_messages WHERE id = ?').get(res.body.id);
      assert.ok(row, 'Row must exist in SQLite');
      assert.strictEqual(row.user_id, normalUserId, 'SQLite user_id MUST match authenticated user id');
      assert.strictEqual(row.status, 'pendiente');
    });

    it('Submission with forged/invalid token gracefully falls back to guest (user_id = null)', async () => {
      const res = await request(app)
        .post('/api/contact')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature')
        .send({
          name: 'Usuario Token Inválido',
          email: 'badtoken@test.local',
          inquiry_type: 'Consulta',
          message: 'Consulta enviada con token JWT corrupto/falso.'
        })
        .expect(201);

      assert.strictEqual(res.body.user_id, null, 'Invalid token must fallback to null user_id');
      createdInquiryIds.push(res.body.id);

      const db = getDb();
      const row = db.prepare('SELECT user_id FROM contact_messages WHERE id = ?').get(res.body.id);
      assert.strictEqual(row.user_id, null, 'SQLite user_id must be null when token is invalid');
    });

    it('Authenticated user cannot spoof another user_id by passing user_id in payload', async () => {
      const res = await request(app)
        .post('/api/contact')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({
          name: 'Spoof Attempt',
          email: 'spoof@test.local',
          inquiry_type: 'Privilege Spoofing',
          message: 'Intentando enviar user_id = 1 (admin).',
          user_id: 1 // Attempting to spoof admin id
        })
        .expect(201);

      // Must be bound to normalUserId, NOT 1
      assert.strictEqual(res.body.user_id, normalUserId);
      createdInquiryIds.push(res.body.id);

      const db = getDb();
      const row = db.prepare('SELECT user_id FROM contact_messages WHERE id = ?').get(res.body.id);
      assert.strictEqual(row.user_id, normalUserId, 'SQLite user_id must be authenticated user, ignoring payload user_id');
    });
  });

  // =========================================================================
  // CHALLENGE 3: Operator Workflow Access Control & Route Authorization
  // =========================================================================
  describe('Challenge 3: Operator Workflow Access Control', () => {
    let sampleInquiryId = null;

    before(async () => {
      // Create a fresh inquiry for route testing
      const res = await request(app)
        .post('/api/contact')
        .send({
          name: 'Workflow Tester',
          email: 'wf_tester@example.com',
          inquiry_type: 'Prueba Operador',
          message: 'Mensaje para verificar control de acceso de operador.'
        });
      sampleInquiryId = res.body.id;
      createdInquiryIds.push(sampleInquiryId);
    });

    it('Unauthenticated requests to operator routes return 401 Unauthorized', async () => {
      // GET /api/operator/messages
      await request(app)
        .get('/api/operator/messages')
        .expect(401);

      // GET /api/operator/messages/:id
      await request(app)
        .get(`/api/operator/messages/${sampleInquiryId}`)
        .expect(401);

      // POST /api/operator/messages/:id/respond
      await request(app)
        .post(`/api/operator/messages/${sampleInquiryId}/respond`)
        .send({ response_message: 'Intento sin token' })
        .expect(401);
    });

    it('Non-operator (usuario_normal) accessing operator routes MUST return HTTP 403 Forbidden', async () => {
      // 1. GET /api/operator/messages
      const resList = await request(app)
        .get('/api/operator/messages')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(403);
      assert.ok(resList.body.error, 'Must return 403 with error message');

      // 2. GET /api/operator/messages/:id
      const resDetail = await request(app)
        .get(`/api/operator/messages/${sampleInquiryId}`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(403);
      assert.ok(resDetail.body.error, 'Must return 403 with error message');

      // 3. POST /api/operator/messages/:id/respond
      const resRespond = await request(app)
        .post(`/api/operator/messages/${sampleInquiryId}/respond`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({ response_message: 'Intento de usuario normal' })
        .expect(403);
      assert.ok(resRespond.body.error, 'Must return 403 with error message');
    });

    it('Operator and Administrator tokens successfully access operator routes (200 OK)', async () => {
      // Operator access
      const opListRes = await request(app)
        .get('/api/operator/messages')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);
      assert.ok(Array.isArray(opListRes.body), 'Operator receives array of messages');

      // Administrator access
      const admListRes = await request(app)
        .get('/api/operator/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      assert.ok(Array.isArray(admListRes.body), 'Administrator receives array of messages');
    });
  });

  // =========================================================================
  // CHALLENGE 4: Non-existent IDs, Boundary Values & Error Handling
  // =========================================================================
  describe('Challenge 4: Boundary & Non-existent IDs Handling', () => {

    it('Replying to non-existent inquiry ID MUST return HTTP 404 Not Found', async () => {
      const nonExistentIds = [
        9999999,
        8888888,
        '999999999999'
      ];

      for (const badId of nonExistentIds) {
        const res = await request(app)
          .post(`/api/operator/messages/${badId}/respond`)
          .set('Authorization', `Bearer ${operatorToken}`)
          .send({ response_message: 'Respondiendo a consulta inexistente.' });

        assert.strictEqual(
          res.status,
          404,
          `Expected 404 for non-existent ID ${badId}, got ${res.status}`
        );
        assert.ok(res.body.error);
      }
    });

    it('Replying to malformed or negative ID returns 404 Not Found', async () => {
      const malformedIds = [
        'not-a-number',
        '-1',
        '-9999',
        '0',
        'abc123'
      ];

      for (const badId of malformedIds) {
        const res = await request(app)
          .post(`/api/operator/messages/${badId}/respond`)
          .set('Authorization', `Bearer ${operatorToken}`)
          .send({ response_message: 'Testing malformed ID.' });

        assert.strictEqual(
          res.status,
          404,
          `Expected 404 for malformed ID "${badId}", got ${res.status}`
        );
      }
    });

    it('Inspecting non-existent or malformed inquiry ID via GET returns 404 Not Found', async () => {
      const badIds = ['999999', 'not-a-number', '-1', '0'];
      for (const badId of badIds) {
        const res = await request(app)
          .get(`/api/operator/messages/${badId}`)
          .set('Authorization', `Bearer ${operatorToken}`);

        assert.strictEqual(
          res.status,
          404,
          `Expected 404 for GET /api/operator/messages/${badId}, got ${res.status}`
        );
      }
    });

    it('Replying without response_message or with whitespace-only returns 400 Bad Request', async () => {
      // 1. Missing response_message
      const resMissing = await request(app)
        .post('/api/operator/messages/1/respond')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({});
      assert.strictEqual(resMissing.status, 400);

      // 2. Empty string
      const resEmpty = await request(app)
        .post('/api/operator/messages/1/respond')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ response_message: '' });
      assert.strictEqual(resEmpty.status, 400);

      // 3. Whitespace only
      const resWhitespace = await request(app)
        .post('/api/operator/messages/1/respond')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ response_message: '    \r\n\t   ' });
      assert.strictEqual(resWhitespace.status, 400);
    });
  });

  // =========================================================================
  // CHALLENGE 5: Status Updates, Responded Timestamp & SQLite Verification
  // =========================================================================
  describe('Challenge 5: Status Transitions & Database Verification', () => {
    let testInquiryId = null;

    before(async () => {
      const inqRes = await request(app)
        .post('/api/contact')
        .send({
          name: 'Status Test Inquirer',
          email: 'status_test@example.com',
          inquiry_type: 'Presupuesto',
          message: 'Mensaje para verificar transición de estado a respondida.'
        });
      testInquiryId = inqRes.body.id;
      createdInquiryIds.push(testInquiryId);
    });

    it('Before reply: Inquiry has status="pendiente", response_message=null, responded_at=null', async () => {
      const db = getDb();
      const row = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(testInquiryId);

      assert.ok(row);
      assert.strictEqual(row.status, 'pendiente');
      assert.strictEqual(row.response_message, null);
      assert.strictEqual(row.responded_at, null);
    });

    it('After reply: Status changes to "respondida" and responded_at is populated', async () => {
      const replyMessageText = 'Estimado/a cliente, confirmamos la recepción y procesamos su solicitud técnica.';

      const res = await request(app)
        .post(`/api/operator/messages/${testInquiryId}/respond`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ response_message: replyMessageText })
        .expect(200);

      assert.strictEqual(res.body.status, 'respondida');
      assert.strictEqual(res.body.response_message, replyMessageText);
      assert.ok(res.body.responded_at, 'responded_at must be populated in response');

      // Verify directly in SQLite
      const db = getDb();
      const updatedRow = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(testInquiryId);

      assert.strictEqual(updatedRow.status, 'respondida', 'SQLite status MUST be "respondida"');
      assert.strictEqual(updatedRow.response_message, replyMessageText, 'SQLite response_message MUST match');
      assert.ok(updatedRow.responded_at, 'SQLite responded_at MUST be set');

      // Verify responded_at is a valid timestamp
      const timestamp = new Date(updatedRow.responded_at).getTime();
      assert.ok(!isNaN(timestamp), 'responded_at must be a parseable timestamp');
    });

    it('Query filtering by ?status=pendiente and ?status=respondida correctly partitions inquiries', async () => {
      // Pending inquiries filter
      const resPending = await request(app)
        .get('/api/operator/messages?status=pendiente')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      assert.ok(Array.isArray(resPending.body));
      for (const msg of resPending.body) {
        assert.strictEqual(msg.status, 'pendiente');
      }

      // Responded inquiries filter
      const resResponded = await request(app)
        .get('/api/operator/messages?status=respondida')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      assert.ok(Array.isArray(resResponded.body));
      const foundTarget = resResponded.body.some(m => m.id === testInquiryId);
      assert.ok(foundTarget, 'Target inquiry must appear in ?status=respondida filter');
      for (const msg of resResponded.body) {
        assert.strictEqual(msg.status, 'respondida');
      }
    });

    it('Query with unknown status filter does not crash and returns unfiltered messages', async () => {
      const res = await request(app)
        .get('/api/operator/messages?status=unknown_status_filter')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      assert.ok(Array.isArray(res.body));
    });
  });

  // =========================================================================
  // CHALLENGE 6: SMTP Unconfigured & Unreachable Host Graceful Degradation
  // =========================================================================
  describe('Challenge 6: SMTP Unconfigured & Unreachable Host Resilience', () => {

    it('Replying with unconfigured SMTP returns HTTP 200 without crashing or 500 error', async () => {
      // Create a fresh inquiry
      const inqRes = await request(app)
        .post('/api/contact')
        .send({
          name: 'Fallback Inquirer',
          email: 'fallback@example.com',
          inquiry_type: 'Fallback Test',
          message: 'Testing graceful fallback when SMTP is unconfigured.'
        });
      const inqId = inqRes.body.id;
      createdInquiryIds.push(inqId);

      // Responding when SMTP is unconfigured
      const res = await request(app)
        .post(`/api/operator/messages/${inqId}/respond`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ response_message: 'Respuesta con fallback de correo local.' });

      assert.strictEqual(res.status, 200, 'Must return HTTP 200 OK without crashing');
      assert.strictEqual(res.body.status, 'respondida');
      assert.ok(res.body.responded_at);
    });

    it('sendInquiryResponse handles unreachable network host without throwing uncaught exceptions', async () => {
      // Directly exercise sendInquiryResponse with invalid/unreachable parameters
      const result = await sendInquiryResponse({
        to: 'unreachable_test@example.com',
        recipientName: 'Unreachable Host Tester',
        inquiryType: 'Prueba de Conexión',
        originalMessage: 'Mensaje original',
        responseMessage: 'Respuesta que prueba la resiliencia ante errores de red'
      });

      // The function must NOT throw an uncaught exception, and must return a fallback object
      assert.ok(typeof result === 'object', 'Result must be an object');
      assert.ok('success' in result, 'Result must contain success field');
      assert.ok('fallback' in result, 'Result must contain fallback flag');
      assert.strictEqual(result.fallback, true, 'Fallback flag must be true when SMTP is unconfigured or unreachable');
    });

    it('sendInquiryResponse handles missing mandatory parameters cleanly', async () => {
      const resNoTo = await sendInquiryResponse({
        to: '',
        responseMessage: 'Missing recipient'
      });
      assert.strictEqual(resNoTo.success, false);
      assert.strictEqual(resNoTo.fallback, true);

      const resNoMsg = await sendInquiryResponse({
        to: 'recipient@example.com',
        responseMessage: '   '
      });
      assert.strictEqual(resNoMsg.success, false);
      assert.strictEqual(resNoMsg.fallback, true);
    });
  });
});
