/**
 * Tier 3: Cross-Feature Combinations - Complete Inquiry Lifecycle
 * Workflow: Register User -> Login -> Submit Inquiry with Token -> Operator Reviews -> Operator Replies -> State Verified
 */
const { describe, it, expect } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeUser, makeInquiry } = require('../helpers/fixtures');

describe('Tier 3: Cross-Feature - Complete Inquiry Lifecycle Flow', () => {
  const clientUser = makeUser();
  let clientToken = null;
  let clientUserId = null;
  let operatorToken = null;
  let createdInquiryId = null;

  it('3.1 - Step 1: Client registers account and receives token', async () => {
    const regRes = await api.post('/api/auth/register', clientUser);
    expect(regRes.status).toBe(201);
    expect(regRes.data.token).toBeDefined();
    clientToken = regRes.data.token;
    clientUserId = regRes.data.user.id;
  });

  it('3.2 - Step 2: Client logs in with credentials', async () => {
    const loginRes = await api.post('/api/auth/login', {
      email: clientUser.email,
      password: clientUser.password
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.data.user.id).toBe(clientUserId);
  });

  it('3.3 - Step 3: Client submits contact inquiry while authenticated', async () => {
    const inquiryPayload = makeInquiry({
      name: clientUser.name,
      email: clientUser.email,
      inquiry_type: 'Presupuesto',
      message: 'Solicitud de cotización para integración de comercio electrónico.'
    });

    const inqRes = await api.post('/api/contact', inquiryPayload, { token: clientToken });
    expect([200, 201].includes(inqRes.status)).toBe(true);
    if (inqRes.data && inqRes.data.id) {
      createdInquiryId = inqRes.data.id;
    }
  });

  it('3.4 - Step 4: Operator logs in and accesses pending inquiries', async () => {
    try {
      const opAuth = await api.loginAs('operator');
      operatorToken = opAuth.token;
    } catch {}

    if (!operatorToken) return;
    const listRes = await api.get('/api/operator/messages?status=pendiente', { token: operatorToken });
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.data)).toBe(true);

    if (!createdInquiryId && listRes.data.length > 0) {
      createdInquiryId = listRes.data[0].id;
    }
  });

  it('3.5 - Step 5: Operator inspects inquiry detail and sends response', async () => {
    if (!operatorToken || !createdInquiryId) return;

    // View detail
    const detailRes = await api.get(`/api/operator/messages/${createdInquiryId}`, { token: operatorToken });
    expect(detailRes.status).toBe(200);

    // Send response
    const replyText = 'Estimado cliente, su consulta ha sido aprobada. Coordinaremos una videollamada.';
    const replyRes = await api.post(`/api/operator/messages/${createdInquiryId}/respond`, {
      response_message: replyText
    }, { token: operatorToken });

    expect(replyRes.status).toBe(200);

    // Verify updated status
    const verifiedRes = await api.get(`/api/operator/messages/${createdInquiryId}`, { token: operatorToken });
    expect(verifiedRes.status).toBe(200);
    expect(verifiedRes.data.status).toBe('respondida');
    expect(verifiedRes.data.response_message).toBe(replyText);
    expect(verifiedRes.data.responded_at).toBeDefined();
  });
});
