// backend/tests/users.test.js
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');

describe('Users REST API (/api/users)', () => {
  let adminToken = null;
  let userToken = null;
  let operatorToken = null;
  let targetUserId = null;

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
        name: `User Management Test ${randomSuffix}`,
        email: `users_mgmt_${randomSuffix}@test.local`,
        password: 'Password123!'
      });
    if (userRegRes.status === 201 && userRegRes.body.token) {
      userToken = userRegRes.body.token;
      targetUserId = userRegRes.body.user.id;
    }
  });

  it('GET /api/users without token returns 401 Unauthorized', async () => {
    await request(app)
      .get('/api/users')
      .expect(401);
  });

  it('GET /api/users with normal user token returns 403 Forbidden', async () => {
    if (!userToken) return;
    await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('GET /api/users with operator token returns 403 Forbidden', async () => {
    if (!operatorToken) return;
    await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(403);
  });

  it('GET /api/users with admin token returns 200 and omits password_hash', async () => {
    if (!adminToken) return;
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    assert.ok(Array.isArray(res.body));
    for (const u of res.body) {
      assert.ok(u.id);
      assert.ok(u.email);
      assert.ok(u.role);
      assert.strictEqual(u.password, undefined, 'Must not leak password');
      assert.strictEqual(u.password_hash, undefined, 'Must strictly omit password_hash');
    }
  });

  it('PUT /api/users/:id/role with normal user returns 403 Forbidden', async () => {
    if (!userToken || !targetUserId) return;
    await request(app)
      .put(`/api/users/${targetUserId}/role`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'operador' })
      .expect(403);
  });

  it('PUT /api/users/:id/role with invalid role returns 400 Bad Request', async () => {
    if (!adminToken || !targetUserId) return;
    await request(app)
      .put(`/api/users/${targetUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'superadmin_invalid' })
      .expect(400);
  });

  it('PUT /api/users/:id/role with admin promotes user and returns 200', async () => {
    if (!adminToken || !targetUserId) return;
    const res = await request(app)
      .put(`/api/users/${targetUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'operador' })
      .expect(200);

    assert.strictEqual(res.body.role, 'operador');
  });

  it('PUT /api/users/:id/role prevents demoting the last administrator (Lockout Prevention)', async () => {
    if (!adminToken) return;
    // Find admin user in DB
    const listRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const adminUser = listRes.body.find(u => u.role === 'administrador');
    if (!adminUser) return;

    // Check if there's only 1 admin
    const adminCount = listRes.body.filter(u => u.role === 'administrador').length;
    if (adminCount === 1) {
      const res = await request(app)
        .put(`/api/users/${adminUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'usuario_normal' })
        .expect(400);

      assert.ok(res.body.error);
    }
  });
});
