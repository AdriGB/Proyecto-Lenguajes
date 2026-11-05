/**
 * Tier 1: Feature Coverage - User Authentication & Session
 * Spec: SPEC:RF-02, RF-03, ARCHITECTURE:8, PROJECT:Features 2, 3, 4
 */
const { describe, it, expect } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeUser } = require('../helpers/fixtures');

describe('Tier 1: Feature Coverage - Authentication & Session Endpoints', () => {
  const testUser = makeUser();
  let authToken = null;
  let createdUserId = null;

  it('2.1 - POST /api/auth/register creates normal user and returns 201 with token', async () => {
    const res = await api.post('/api/auth/register', {
      name: testUser.name,
      email: testUser.email,
      password: testUser.password
    });

    expect(res.status).toBe(201);
    expect(res.data).toBeDefined();
    expect(res.data.token).toBeDefined();
    expect(typeof res.data.token).toBe('string');
    expect(res.data.user).toBeDefined();
    expect(res.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.data.user.name).toBe(testUser.name);

    authToken = res.data.token;
    createdUserId = res.data.user.id;
  });

  it('2.2 - Registration response must NOT leak password or password_hash', async () => {
    const res = await api.post('/api/auth/register', makeUser());
    expect(res.status).toBe(201);
    expect(res.data.user.password).toBeUndefined();
    expect(res.data.user.password_hash).toBeUndefined();
    expect(res.data.user.role).toBe('usuario_normal');
  });

  it('2.3 - POST /api/auth/login with valid credentials returns 200 and token', async () => {
    const res = await api.post('/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });

    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
    expect(res.data.token).toBeDefined();
    expect(res.data.user).toBeDefined();
    expect(res.data.user.id).toBe(createdUserId);
    expect(res.data.user.role).toBe('usuario_normal');
  });

  it('2.4 - POST /api/auth/login with incorrect password returns 401 Unauthorized', async () => {
    const res = await api.post('/api/auth/login', {
      email: testUser.email,
      password: 'CompletelyWrongPassword!'
    });

    expect(res.status).toBe(401);
  });

  it('2.5 - GET /api/auth/me with valid Bearer token returns user profile', async () => {
    const res = await api.get('/api/auth/me', { token: authToken });
    expect(res.status).toBe(200);
    expect(res.data.user).toBeDefined();
    expect(res.data.user.id).toBe(createdUserId);
    expect(res.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.data.user.role).toBe('usuario_normal');
    expect(res.data.user.password_hash).toBeUndefined();
  });

  it('2.6 - GET /api/auth/me without Authorization header returns 401 Unauthorized', async () => {
    const res = await api.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('2.7 - GET /api/auth/me with invalid or forged Bearer token returns 401 Unauthorized', async () => {
    const res = await api.get('/api/auth/me', { token: 'invalid.forged.jwt.token' });
    expect(res.status).toBe(401);
  });
});
