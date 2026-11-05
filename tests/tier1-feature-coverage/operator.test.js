/**
 * Tier 1: Feature Coverage - Operator Inquiries Management
 * Spec: SPEC:RF-07, RF-08, RF-09, DATABASE:5, PROJECT:Features 12, 13, 14
 */
const { describe, it, expect, beforeAll } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeInquiry, makeUser } = require('../helpers/fixtures');

describe('Tier 1: Feature Coverage - Operator Inquiries Endpoints', () => {
  let operatorToken = null;
  let userToken = null;
  let testMessageId = null;

  beforeAll(async () => {
    try {
      const opAuth = await api.loginAs('operator');
      operatorToken = opAuth.token;
    } catch {}

    const userRes = await api.post('/api/auth/register', makeUser());
    if (userRes.status === 201 && userRes.data) {
      userToken = userRes.data.token;
    }

    // Submit a fresh inquiry to ensure at least one exists
    const inq = makeInquiry();
    const inqRes = await api.post('/api/contact', inq);
    if (inqRes.data && inqRes.data.id) {
      testMessageId = inqRes.data.id;
    }
  });

  it('6.1 - GET /api/operator/messages with operator token returns 200 and message list', async () => {
    if (!operatorToken) return;
    const res = await api.get('/api/operator/messages', { token: operatorToken });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    if (res.data.length > 0 && !testMessageId) {
      testMessageId = res.data[0].id;
    }
  });

  it('6.2 - GET /api/operator/messages rejects normal user (403) and guest (401)', async () => {
    // Guest
    const guestRes = await api.get('/api/operator/messages');
    expect(guestRes.status).toBe(401);

    // Normal user
    if (userToken) {
      const userRes = await api.get('/api/operator/messages', { token: userToken });
      expect(userRes.status).toBe(403);
    }
  });

  it('6.3 - GET /api/operator/messages?status=pendiente filters by pending inquiries', async () => {
    if (!operatorToken) return;
    const res = await api.get('/api/operator/messages?status=pendiente', { token: operatorToken });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    for (const msg of res.data) {
      expect(msg.status).toBe('pendiente');
    }
  });

  it('6.4 - GET /api/operator/messages/:id returns inquiry details', async () => {
    if (!operatorToken || !testMessageId) return;
    const res = await api.get(`/api/operator/messages/${testMessageId}`, { token: operatorToken });
    expect(res.status).toBe(200);
    expect(res.data.id).toBe(testMessageId);
    expect(res.data.inquiry_type).toBeDefined();
    expect(res.data.message).toBeDefined();
  });

  it('6.5 - POST /api/operator/messages/:id/respond updates status to "respondida"', async () => {
    if (!operatorToken || !testMessageId) return;
    const responsePayload = {
      response_message: 'Estimado/a, gracias por contactarnos. Hemos evaluado su propuesta.'
    };
    const res = await api.post(`/api/operator/messages/${testMessageId}/respond`, responsePayload, {
      token: operatorToken
    });

    expect(res.status).toBe(200);
    if (res.data && res.data.status) {
      expect(res.data.status).toBe('respondida');
    }
  });

  it('6.6 - Responded message stores response_message and responded_at timestamp', async () => {
    if (!operatorToken || !testMessageId) return;
    const res = await api.get(`/api/operator/messages/${testMessageId}`, { token: operatorToken });
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('respondida');
    expect(res.data.response_message).toBeDefined();
    expect(res.data.responded_at).toBeDefined();
  });
});
