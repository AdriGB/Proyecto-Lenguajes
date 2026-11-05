// backend/tests/operator.test.js
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');

describe('Operator REST API (/api/operator)', () => {
  let operatorToken = null;
  let adminToken = null;
  let userToken = null;
  let testInquiryId = null;

  before(async () => {
    // Login operator
    const opLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operador@portfolio.local', password: 'operador123' });
    if (opLoginRes.status === 200 && opLoginRes.body.token) {
      operatorToken = opLoginRes.body.token;
    }

    // Login admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@portfolio.local', password: 'admin123' });
    if (adminLoginRes.status === 200 && adminLoginRes.body.token) {
      adminToken = adminLoginRes.body.token;
    }

    // Register normal user
    const randomSuffix = Date.now();
    const userRegRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: `Operator Tester ${randomSuffix}`,
        email: `op_tester_${randomSuffix}@test.local`,
        password: 'Password123!'
      });
    if (userRegRes.status === 201 && userRegRes.body.token) {
      userToken = userRegRes.body.token;
    }

    // Seed a fresh inquiry
    const inqRes = await request(app)
      .post('/api/contact')
      .send({
        name: 'Inquirer For Operator',
        email: 'inq_for_op@example.com',
        inquiry_type: 'Presupuesto',
        message: 'Consulta para verificar operaciones de soporte.'
      });
    if (inqRes.status === 201 && inqRes.body.id) {
      testInquiryId = inqRes.body.id;
    }
  });

  it('GET /api/operator/messages without token returns 401 Unauthorized', async () => {
    await request(app)
      .get('/api/operator/messages')
      .expect(401);
  });

  it('GET /api/operator/messages with normal user token returns 403 Forbidden', async () => {
    if (!userToken) return;
    await request(app)
      .get('/api/operator/messages')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('GET /api/operator/messages with operator token returns 200 and message list', async () => {
    if (!operatorToken) return;
    const res = await request(app)
      .get('/api/operator/messages')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);

    assert.ok(Array.isArray(res.body));
    if (res.body.length > 0 && !testInquiryId) {
      testInquiryId = res.body[0].id;
    }
  });

  it('GET /api/operator/messages?status=pendiente filters pending inquiries', async () => {
    if (!operatorToken) return;
    const res = await request(app)
      .get('/api/operator/messages?status=pendiente')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);

    assert.ok(Array.isArray(res.body));
    for (const msg of res.body) {
      assert.strictEqual(msg.status, 'pendiente');
    }
  });

  it('GET /api/operator/messages/:id returns message detail', async () => {
    if (!operatorToken || !testInquiryId) return;
    const res = await request(app)
      .get(`/api/operator/messages/${testInquiryId}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);

    assert.strictEqual(res.body.id, testInquiryId);
    assert.ok(res.body.message);
  });

  it('GET /api/operator/messages/999999 returns 404 Not Found', async () => {
    if (!operatorToken) return;
    await request(app)
      .get('/api/operator/messages/999999')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(404);
  });

  it('POST /api/operator/messages/:id/respond updates status to respondida and logs response', async () => {
    if (!operatorToken || !testInquiryId) return;
    const replyText = 'Estimado/a, gracias por contactarnos. Hemos recibido su consulta satisfactoriamente.';

    const res = await request(app)
      .post(`/api/operator/messages/${testInquiryId}/respond`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ response_message: replyText })
      .expect(200);

    assert.strictEqual(res.body.status, 'respondida');

    // Verify detail
    const detailRes = await request(app)
      .get(`/api/operator/messages/${testInquiryId}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);

    assert.strictEqual(detailRes.body.status, 'respondida');
    assert.strictEqual(detailRes.body.response_message, replyText);
    assert.ok(detailRes.body.responded_at);
  });

  it('POST /api/operator/messages/:id/respond without response_message returns 400 Bad Request', async () => {
    if (!operatorToken || !testInquiryId) return;
    await request(app)
      .post(`/api/operator/messages/${testInquiryId}/respond`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({})
      .expect(400);
  });
});
