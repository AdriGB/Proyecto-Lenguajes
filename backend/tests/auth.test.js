// backend/tests/auth.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');

describe('Auth REST API (/api/auth)', () => {
  const randomSuffix = Date.now();
  const testUser = {
    name: `Auth Test User ${randomSuffix}`,
    email: `auth_test_${randomSuffix}@test.local`,
    password: 'SecurePassword123!'
  };
  let userToken = null;

  it('POST /api/auth/register creates normal user and returns 201 with token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    assert.ok(res.body.token, 'Should return jwt token');
    assert.ok(res.body.user, 'Should return user object');
    assert.strictEqual(res.body.user.email, testUser.email.toLowerCase());
    assert.strictEqual(res.body.user.role, 'usuario_normal');
    assert.strictEqual(res.body.user.password, undefined);
    assert.strictEqual(res.body.user.password_hash, undefined);

    userToken = res.body.token;
  });

  it('POST /api/auth/register with duplicate email returns 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    assert.ok([400, 409].includes(res.status), `Expected 409 or 400 for duplicate email, got ${res.status}`);
  });

  it('POST /api/auth/register with empty payload returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({})
      .expect(400);

    assert.ok(res.body.error);
  });

  it('POST /api/auth/login with valid credentials returns 200 and token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(200);

    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.email, testUser.email.toLowerCase());
  });

  it('POST /api/auth/login with invalid password returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999!'
      })
      .expect(401);

    assert.ok(res.body.error);
  });

  it('GET /api/auth/me with valid Bearer token returns profile', async () => {
    if (!userToken) return;
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    assert.ok(res.body.user);
    assert.strictEqual(res.body.user.email, testUser.email.toLowerCase());
  });

  it('GET /api/auth/me without token returns 401 Unauthorized', async () => {
    await request(app)
      .get('/api/auth/me')
      .expect(401);
  });
});
