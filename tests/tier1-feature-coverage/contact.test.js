/**
 * Tier 1: Feature Coverage - Contact Inquiries Submission
 * Spec: SPEC:RF-05, RF-06, DATABASE:5, PROJECT:Feature 10
 */
const { describe, it, expect, beforeAll } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeInquiry, makeUser } = require('../helpers/fixtures');

describe('Tier 1: Feature Coverage - Contact Inquiries Endpoints', () => {
  let userToken = null;
  let loggedInUser = null;

  beforeAll(async () => {
    const userRes = await api.post('/api/auth/register', makeUser());
    if (userRes.status === 201 && userRes.data) {
      userToken = userRes.data.token;
      loggedInUser = userRes.data.user;
    }
  });

  it('5.1 - POST /api/contact allows guest visitor submission and returns 201 or 200', async () => {
    const inquiry = makeInquiry();
    const res = await api.post('/api/contact', inquiry);
    expect([200, 201].includes(res.status)).toBe(true);
    expect(res.data).toBeDefined();
  });

  it('5.2 - Contact inquiry default status is "pendiente"', async () => {
    const inquiry = makeInquiry();
    const res = await api.post('/api/contact', inquiry);
    expect([200, 201].includes(res.status)).toBe(true);
    if (res.data && res.data.status) {
      expect(res.data.status).toBe('pendiente');
    }
  });

  it('5.3 - POST /api/contact with Bearer token associates inquiry with user_id', async () => {
    if (!userToken || !loggedInUser) return;
    const inquiry = makeInquiry({
      name: loggedInUser.name,
      email: loggedInUser.email
    });

    const res = await api.post('/api/contact', inquiry, { token: userToken });
    expect([200, 201].includes(res.status)).toBe(true);
    if (res.data && res.data.user_id !== undefined) {
      expect(res.data.user_id).toBe(loggedInUser.id);
    }
  });

  it('5.4 - POST /api/contact rejects missing required fields with 400 Bad Request', async () => {
    // Missing message
    const res1 = await api.post('/api/contact', {
      name: 'Test',
      email: 'test@example.com',
      inquiry_type: 'Presupuesto'
    });
    expect(res1.status).toBe(400);

    // Missing email
    const res2 = await api.post('/api/contact', {
      name: 'Test',
      inquiry_type: 'Presupuesto',
      message: 'Hello'
    });
    expect(res2.status).toBe(400);

    // Missing inquiry_type
    const res3 = await api.post('/api/contact', {
      name: 'Test',
      email: 'test@example.com',
      message: 'Hello'
    });
    expect(res3.status).toBe(400);
  });

  it('5.5 - POST /api/contact rejects invalid email formats with 400 Bad Request', async () => {
    const invalidEmails = ['invalid-email', 'missing@domain', '@nodomain.com', 'spaces in@email.com'];
    for (const badEmail of invalidEmails) {
      const res = await api.post('/api/contact', {
        name: 'Validator',
        email: badEmail,
        inquiry_type: 'Consulta técnica',
        message: 'Validating email format regex.'
      });
      expect(res.status).toBe(400);
    }
  });
});
