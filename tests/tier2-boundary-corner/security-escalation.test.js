/**
 * Tier 2: Boundary & Corner Cases - Security & Privilege Escalation
 */
const { describe, it, expect, beforeAll } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeUser, makeProject } = require('../helpers/fixtures');

describe('Tier 2: Boundary & Corner Cases - Security & Privilege Escalation', () => {
  let userToken = null;
  let operatorToken = null;

  beforeAll(async () => {
    const userRes = await api.post('/api/auth/register', makeUser());
    if (userRes.status === 201 && userRes.data) {
      userToken = userRes.data.token;
    }
    try {
      const opAuth = await api.loginAs('operator');
      operatorToken = opAuth.token;
    } catch {}
  });

  it('2.9 - Normal user cannot access GET /api/operator/messages (403 Forbidden)', async () => {
    if (!userToken) return;
    const res = await api.get('/api/operator/messages', { token: userToken });
    expect(res.status).toBe(403);
  });

  it('2.10 - Normal user cannot access GET /api/metrics (403 Forbidden)', async () => {
    if (!userToken) return;
    const res = await api.get('/api/metrics', { token: userToken });
    expect(res.status).toBe(403);
  });

  it('2.11 - Operator cannot access GET /api/metrics (403 Forbidden)', async () => {
    if (!operatorToken) return;
    const res = await api.get('/api/metrics', { token: operatorToken });
    expect(res.status).toBe(403);
  });

  it('2.12 - Normal user cannot create projects POST /api/projects (403 Forbidden)', async () => {
    if (!userToken) return;
    const res = await api.post('/api/projects', makeProject(), { token: userToken });
    expect(res.status).toBe(403);
  });

  it('2.13 - Normal user cannot alter user roles PUT /api/users/:id/role (403 Forbidden)', async () => {
    if (!userToken) return;
    const res = await api.put('/api/users/1/role', { role: 'administrador' }, { token: userToken });
    expect(res.status).toBe(403);
  });

  it('2.14 - Role injection in POST /api/auth/register must NOT grant admin role', async () => {
    const maliciousUser = makeUser({ role: 'administrador' });
    const res = await api.post('/api/auth/register', maliciousUser);

    if (res.status === 201) {
      // Must ignore the injected role and assign usuario_normal
      expect(res.data.user.role).toBe('usuario_normal');
    } else {
      expect([400, 403].includes(res.status)).toBe(true);
    }
  });

  it('2.15 - Forged or tampered JWT tokens return 401 Unauthorized', async () => {
    const forgedTokens = [
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fakeSignatureHere',
      'invalid.jwt.token',
      'Bearer ',
      'null'
    ];
    for (const token of forgedTokens) {
      const res = await api.get('/api/auth/me', { token });
      expect(res.status).toBe(401);
    }
  });

  it('2.16 - SQL Injection in login credentials must fail authentication (401)', async () => {
    const sqliPayloads = [
      "' OR '1'='1",
      "admin' --",
      "' OR 1=1; --",
      "\" OR \"\"=\""
    ];

    for (const sqli of sqliPayloads) {
      const res = await api.post('/api/auth/login', {
        email: sqli,
        password: sqli
      });
      expect([400, 401].includes(res.status)).toBe(true);
    }
  });
});
