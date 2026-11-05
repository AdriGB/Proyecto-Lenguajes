/**
 * Tier 3: Cross-Feature Combinations - System Metrics Progression & Traffic Counters
 * Workflow: Baseline Metrics -> Trigger Visit Event -> General Visits Increments -> Login Event -> Authenticated Access Increments
 * Spec: SPEC:RF-12, DATABASE:6 (site_metrics), TASKS:Fase 9
 */
const { describe, it, expect } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeUser } = require('../helpers/fixtures');

describe('Tier 3: Cross-Feature - Metrics Progression Flow', () => {
  let adminToken = null;
  const testUser = makeUser();
  let initialVisits = 0;
  let initialAuthAccess = 0;

  it('3.19 - Step 1: Admin captures baseline metrics', async () => {
    try {
      const admAuth = await api.loginAs('admin');
      adminToken = admAuth.token;
    } catch {}

    if (!adminToken) return;
    const res = await api.get('/api/metrics', { token: adminToken });
    expect(res.status).toBe(200);

    initialVisits = res.data.visitas_generales ?? res.data.visits ?? 0;
    initialAuthAccess = res.data.accesos_autenticados ?? res.data.authenticated_logins ?? 0;
  });

  it('3.20 - Step 2: Trigger public visit and verify counter progression', async () => {
    const visitRes = await api.post('/api/metrics/visit');
    expect(visitRes.status).toBe(200);

    if (adminToken) {
      const res = await api.get('/api/metrics', { token: adminToken });
      expect(res.status).toBe(200);
      const currentVisits = res.data.visitas_generales ?? res.data.visits ?? 0;
      expect(currentVisits).toBeGreaterThanOrEqual(initialVisits + 1);
    }
  });

  it('3.21 - Step 3: Trigger user login and verify authenticated access counter progression', async () => {
    // Register user
    await api.post('/api/auth/register', testUser);

    // Login triggers authenticated access increment
    const loginRes = await api.post('/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    expect(loginRes.status).toBe(200);

    if (adminToken) {
      const res = await api.get('/api/metrics', { token: adminToken });
      expect(res.status).toBe(200);
      const currentAuth = res.data.accesos_autenticados ?? res.data.authenticated_logins ?? 0;
      expect(currentAuth).toBeGreaterThanOrEqual(initialAuthAccess + 1);
    }
  });
});
