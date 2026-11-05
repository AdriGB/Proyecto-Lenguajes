/**
 * Tier 3: Cross-Feature Combinations - Dynamic Role Promotion & Privilege Elevation
 * Workflow: Register Normal User -> 403 Operator Access -> Admin Promotes to 'operador' -> 200 Operator Access
 * Spec: SPEC:4, SPEC:RF-11, DATABASE:users.role
 */
const { describe, it, expect } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeUser } = require('../helpers/fixtures');

describe('Tier 3: Cross-Feature - Role Promotion & Privilege Transition', () => {
  let adminToken = null;
  const candidateUser = makeUser();
  let candidateUserId = null;
  let candidateToken = null;

  it('3.15 - Step 1: Register candidate user with default role (usuario_normal)', async () => {
    try {
      const admAuth = await api.loginAs('admin');
      adminToken = admAuth.token;
    } catch {}

    const regRes = await api.post('/api/auth/register', candidateUser);
    expect(regRes.status).toBe(201);
    candidateUserId = regRes.data.user.id;
    candidateToken = regRes.data.token;
    expect(regRes.data.user.role).toBe('usuario_normal');
  });

  it('3.16 - Step 2: Candidate user attempts operator route and is rejected (403)', async () => {
    if (!candidateToken) return;
    const res = await api.get('/api/operator/messages', { token: candidateToken });
    expect(res.status).toBe(403);
  });

  it('3.17 - Step 3: Admin promotes candidate user to "operador"', async () => {
    if (!adminToken || !candidateUserId) return;
    const res = await api.put(`/api/users/${candidateUserId}/role`, { role: 'operador' }, {
      token: adminToken
    });

    expect(res.status).toBe(200);
    expect(res.data.role).toBe('operador');
  });

  it('3.18 - Step 4: Promoted user re-authenticates and successfully accesses operator route (200)', async () => {
    if (!candidateUserId) return;
    const loginRes = await api.post('/api/auth/login', {
      email: candidateUser.email,
      password: candidateUser.password
    });

    expect(loginRes.status).toBe(200);
    const updatedToken = loginRes.data.token;
    expect(loginRes.data.user.role).toBe('operador');

    const opRes = await api.get('/api/operator/messages', { token: updatedToken });
    expect(opRes.status).toBe(200);
  });
});
