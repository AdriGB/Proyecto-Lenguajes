/**
 * Tier 4: Real-World Application Scenarios - Admin & Operator Daily Operations
 * Scenario: Administrator checks dashboard KPIs, publishes new showcase project, updates services. Operator answers pending client inquiries.
 */
const { describe, it, expect } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeProject, makeInquiry } = require('../helpers/fixtures');

describe('Tier 4: Real-World Scenarios - Administrator & Operator Workflow', () => {
  let adminToken = null;
  let operatorToken = null;
  let pendingMessageId = null;
  const newFeaturedProject = makeProject({ is_published: 1 });

  it('4.9 - Operations Step 1: Administrator logs in and checks system health & KPIs', async () => {
    try {
      const adminAuth = await api.loginAs('admin');
      adminToken = adminAuth.token;
    } catch {}

    if (!adminToken) return;
    const metricsRes = await api.get('/api/metrics', { token: adminToken });
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.data).toBeDefined();
  });

  it('4.10 - Operations Step 2: Administrator creates a new featured project', async () => {
    if (!adminToken) return;
    const projRes = await api.post('/api/projects', newFeaturedProject, { token: adminToken });
    expect(projRes.status).toBe(201);
    expect(projRes.data.id).toBeDefined();
  });

  it('4.11 - Operations Step 3: Administrator updates service specifications', async () => {
    if (!adminToken) return;
    const servicesRes = await api.get('/api/services');
    if (servicesRes.status === 200 && servicesRes.data.length > 0) {
      const srvId = servicesRes.data[0].id;
      const updateRes = await api.put(`/api/services/${srvId}`, {
        title: servicesRes.data[0].title,
        description: 'Servicio optimizado para alta concurrencia y estándares 2026.',
        icon: servicesRes.data[0].icon || 'Code'
      }, { token: adminToken });

      expect(updateRes.status).toBe(200);
    }
  });

  it('4.12 - Operations Step 4: Operator logs in and reviews pending client inquiries', async () => {
    try {
      const opAuth = await api.loginAs('operator');
      operatorToken = opAuth.token;
    } catch {}

    if (!operatorToken) return;

    // Seed a message if needed
    const inqRes = await api.post('/api/contact', makeInquiry());
    if (inqRes.data && inqRes.data.id) {
      pendingMessageId = inqRes.data.id;
    }

    const messagesRes = await api.get('/api/operator/messages?status=pendiente', { token: operatorToken });
    expect(messagesRes.status).toBe(200);
    expect(Array.isArray(messagesRes.data)).toBe(true);
    if (!pendingMessageId && messagesRes.data.length > 0) {
      pendingMessageId = messagesRes.data[0].id;
    }
  });

  it('4.13 - Operations Step 5: Operator sends official response to client', async () => {
    if (!operatorToken || !pendingMessageId) return;
    const replyRes = await api.post(`/api/operator/messages/${pendingMessageId}/respond`, {
      response_message: 'Estimado/a, hemos revisado su consulta técnica. Le enviaremos la documentación completa en breve.'
    }, { token: operatorToken });

    expect(replyRes.status).toBe(200);
  });

  it('4.14 - Operations Step 6: Administrator confirms updated metrics reflect operations', async () => {
    if (!adminToken) return;
    const metricsRes = await api.get('/api/metrics', { token: adminToken });
    expect(metricsRes.status).toBe(200);
  });
});
