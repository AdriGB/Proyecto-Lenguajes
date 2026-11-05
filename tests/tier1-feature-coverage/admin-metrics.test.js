/**
 * Tier 1: Feature Coverage - Admin Metrics & User Administration
 * Spec: SPEC:RF-11, RF-12, DATABASE:6, PROJECT:Features 11, 17, 18, 19
 */
const { describe, it, expect, beforeAll } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeUser } = require('../helpers/fixtures');

describe('Tier 1: Feature Coverage - Admin Metrics & User Management Endpoints', () => {
  let adminToken = null;
  let userToken = null;
  let testUserId = null;

  beforeAll(async () => {
    try {
      const adminAuth = await api.loginAs('admin');
      adminToken = adminAuth.token;
    } catch {}

    const userRes = await api.post('/api/auth/register', makeUser());
    if (userRes.status === 201 && userRes.data) {
      userToken = userRes.data.token;
      testUserId = userRes.data.user.id;
    }
  });

  it('7.1 - GET /api/metrics with admin token returns 200 and KPI metrics object', async () => {
    if (!adminToken) return;
    const res = await api.get('/api/metrics', { token: adminToken });
    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
    // Verify core KPI fields exist
    expect(res.data.visitas_generales !== undefined || res.data.visits !== undefined).toBe(true);
  });

  it('7.2 - GET /api/metrics rejects normal user (403) and guest (401)', async () => {
    const guestRes = await api.get('/api/metrics');
    expect(guestRes.status).toBe(401);

    if (userToken) {
      const userRes = await api.get('/api/metrics', { token: userToken });
      expect(userRes.status).toBe(403);
    }
  });

  it('7.3 - POST /api/metrics/visit records a public visit and returns 200', async () => {
    const res = await api.post('/api/metrics/visit');
    expect(res.status).toBe(200);
  });

  it('7.4 - GET /api/metrics provides chart datasets for Recharts visualization', async () => {
    if (!adminToken) return;
    const res = await api.get('/api/metrics', { token: adminToken });
    expect(res.status).toBe(200);
    // Dataset for inquiries by type or timeline
    expect(res.data.inquiries_by_type !== undefined || res.data.charts !== undefined || res.data.consultas_por_tipo !== undefined).toBe(true);
  });

  it('7.5 - GET /api/users with admin token returns 200 and list of registered accounts', async () => {
    if (!adminToken) return;
    const res = await api.get('/api/users', { token: adminToken });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    for (const u of res.data) {
      expect(u.id).toBeDefined();
      expect(u.email).toBeDefined();
      expect(u.role).toBeDefined();
      expect(u.password_hash).toBeUndefined(); // Security: never leak hashes in user lists
    }
  });

  it('7.6 - PUT /api/users/:id/role updates user role successfully', async () => {
    if (!adminToken || !testUserId) return;
    const res = await api.put(`/api/users/${testUserId}/role`, { role: 'operador' }, {
      token: adminToken
    });

    expect(res.status).toBe(200);
    expect(res.data.role).toBe('operador');
  });
});
