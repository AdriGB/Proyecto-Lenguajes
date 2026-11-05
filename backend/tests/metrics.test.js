// backend/tests/metrics.test.js
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');

describe('Metrics REST API (/api/metrics)', () => {
  let adminToken = null;
  let userToken = null;
  let operatorToken = null;

  before(async () => {
    // Admin login
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@portfolio.local', password: 'admin123' });
    if (adminLoginRes.status === 200 && adminLoginRes.body.token) {
      adminToken = adminLoginRes.body.token;
    }

    // Operator login
    const opLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operador@portfolio.local', password: 'operador123' });
    if (opLoginRes.status === 200 && opLoginRes.body.token) {
      operatorToken = opLoginRes.body.token;
    }

    // Normal user registration
    const randomSuffix = Date.now();
    const userRegRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: `Metrics User ${randomSuffix}`,
        email: `metrics_user_${randomSuffix}@test.local`,
        password: 'Password123!'
      });
    if (userRegRes.status === 201 && userRegRes.body.token) {
      userToken = userRegRes.body.token;
    }
  });

  it('POST /api/metrics/visit is public and increments visitas_generales', async () => {
    const res1 = await request(app)
      .post('/api/metrics/visit')
      .expect(200);

    assert.strictEqual(res1.body.success, true);
    assert.ok(typeof res1.body.count === 'number');

    const res2 = await request(app)
      .post('/api/metrics/visit')
      .expect(200);

    assert.strictEqual(res2.body.success, true);
    assert.strictEqual(res2.body.count, res1.body.count + 1);
  });

  it('GET /api/metrics without token returns 401 Unauthorized', async () => {
    await request(app)
      .get('/api/metrics')
      .expect(401);
  });

  it('GET /api/metrics with normal user token returns 403 Forbidden', async () => {
    if (!userToken) return;
    await request(app)
      .get('/api/metrics')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('GET /api/metrics with operator token returns 403 Forbidden', async () => {
    if (!operatorToken) return;
    await request(app)
      .get('/api/metrics')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(403);
  });

  it('GET /api/metrics with admin token returns 200 and all aggregated KPIs', async () => {
    if (!adminToken) return;
    const res = await request(app)
      .get('/api/metrics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    assert.ok(typeof res.body.visitas_generales === 'number');
    assert.ok(typeof res.body.accesos_autenticados === 'number');
    assert.ok(typeof res.body.total_users === 'number');
    assert.ok(typeof res.body.total_projects === 'number');
    assert.ok(typeof res.body.total_services === 'number');
    assert.ok(typeof res.body.total_messages === 'number');
    assert.ok(typeof res.body.pending_messages === 'number');
    assert.ok(typeof res.body.responded_messages === 'number');

    // Chart datasets
    assert.ok(Array.isArray(res.body.inquiriesByType));
    assert.ok(Array.isArray(res.body.registrationsTimeline));
  });

  it('POST /api/auth/login increments accesos_autenticados metric in GET /api/metrics', async () => {
    if (!adminToken) return;

    const beforeRes = await request(app)
      .get('/api/metrics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const beforeAuth = beforeRes.body.accesos_autenticados;

    // Login event
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@portfolio.local', password: 'admin123' })
      .expect(200);

    const afterRes = await request(app)
      .get('/api/metrics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const afterAuth = afterRes.body.accesos_autenticados;

    assert.ok(afterAuth >= beforeAuth + 1, 'accesos_autenticados should increment on login');
  });
});
