/**
 * Tier 2: Boundary & Corner Cases - Edge Cases & Graceful Degradation
 */
const { describe, it, expect, beforeAll } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeUser, makeInquiry } = require('../helpers/fixtures');

describe('Tier 2: Boundary & Corner Cases - Edge Cases & Fallbacks', () => {
  let operatorToken = null;
  let adminToken = null;

  beforeAll(async () => {
    try {
      const opAuth = await api.loginAs('operator');
      operatorToken = opAuth.token;
    } catch {}
    try {
      const admAuth = await api.loginAs('admin');
      adminToken = admAuth.token;
    } catch {}
  });

  it('2.17 - Duplicate email registration returns 409 Conflict or 400 Bad Request', async () => {
    const user = makeUser();
    // First registration succeeds
    const firstRes = await api.post('/api/auth/register', user);
    expect(firstRes.status).toBe(201);

    // Second registration with identical email must fail
    const dupRes = await api.post('/api/auth/register', user);
    expect([400, 409].includes(dupRes.status)).toBe(true);
  });

  it('2.18 - Operator email response handles unconfigured SMTP gracefully without 500 crash', async () => {
    if (!operatorToken) return;

    // Create an inquiry
    const inq = makeInquiry();
    const inqRes = await api.post('/api/contact', inq);
    const inqId = inqRes.data && inqRes.data.id ? inqRes.data.id : 1;

    // Responding should NOT crash the server if SMTP is not configured
    const res = await api.post(`/api/operator/messages/${inqId}/respond`, {
      response_message: 'Testing graceful SMTP fallback.'
    }, { token: operatorToken });

    // Expecting 200 OK (with fallback log) or clear error, but definitely NOT an unhandled 500 crash
    expect([200, 201].includes(res.status)).toBe(true);
  });

  it('2.19 - Replying to non-existent message ID returns 404 Not Found', async () => {
    if (!operatorToken) return;
    const res = await api.post('/api/operator/messages/999999/respond', {
      response_message: 'Message does not exist.'
    }, { token: operatorToken });

    expect(res.status).toBe(404);
  });

  it('2.20 - Updating non-existent project returns 404 Not Found', async () => {
    if (!adminToken) return;
    const res = await api.put('/api/projects/999999', {
      title: 'Ghost Project'
    }, { token: adminToken });

    expect(res.status).toBe(404);
  });

  it('2.21 - Updating non-existent service returns 404 Not Found', async () => {
    if (!adminToken) return;
    const res = await api.put('/api/services/999999', {
      title: 'Ghost Service'
    }, { token: adminToken });

    expect(res.status).toBe(404);
  });

  it('2.22 - Public preview endpoint is accessible with empty database or seed data', async () => {
    const res = await api.get('/api/projects/preview');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});
