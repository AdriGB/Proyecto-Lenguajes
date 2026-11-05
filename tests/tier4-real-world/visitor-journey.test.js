/**
 * Tier 4: Real-World Application Scenarios - Visitor End-to-End Journey
 * Scenario: Prospective Client/Visitor explores portfolio, contacts developer, registers account, and reviews private projects catalog.
 */
const { describe, it, expect } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeUser, makeInquiry } = require('../helpers/fixtures');

describe('Tier 4: Real-World Scenarios - Visitor End-to-End User Journey', () => {
  const visitorProfile = makeUser();
  let visitorToken = null;
  let sampleProjectId = null;

  it('4.1 - Journey Step 1: Visitor lands on homepage, triggering visit telemetry', async () => {
    const visitRes = await api.post('/api/metrics/visit');
    expect(visitRes.status).toBe(200);
  });

  it('4.2 - Journey Step 2: Visitor inspects professional services offered', async () => {
    const servicesRes = await api.get('/api/services');
    expect(servicesRes.status).toBe(200);
    expect(Array.isArray(servicesRes.data)).toBe(true);
    expect(servicesRes.data.length).toBeGreaterThanOrEqual(1);
  });

  it('4.3 - Journey Step 3: Visitor reviews public showcase project previews', async () => {
    const previewRes = await api.get('/api/projects/preview');
    expect(previewRes.status).toBe(200);
    expect(Array.isArray(previewRes.data)).toBe(true);
    if (previewRes.data.length > 0) {
      sampleProjectId = previewRes.data[0].id;
    }
  });

  it('4.4 - Journey Step 4: Visitor attempts to enter private projects catalog without login', async () => {
    const unauthRes = await api.get('/api/projects');
    expect(unauthRes.status).toBe(401); // Prompting login / registration
  });

  it('4.5 - Journey Step 5: Visitor sends inquiry through public contact form', async () => {
    const inq = makeInquiry({
      name: visitorProfile.name,
      email: visitorProfile.email,
      inquiry_type: 'Presupuesto',
      message: 'Me interesó mucho su proyecto Ether E-Commerce. ¿Tienen disponibilidad para un proyecto similar?'
    });

    const contactRes = await api.post('/api/contact', inq);
    expect([200, 201].includes(contactRes.status)).toBe(true);
  });

  it('4.6 - Journey Step 6: Visitor registers account to access exclusive content', async () => {
    const regRes = await api.post('/api/auth/register', visitorProfile);
    expect(regRes.status).toBe(201);
    expect(regRes.data.token).toBeDefined();
    visitorToken = regRes.data.token;
  });

  it('4.7 - Journey Step 7: Visitor unlocks private projects gallery with auth token', async () => {
    expect(visitorToken).toBeDefined();
    const catalogRes = await api.get('/api/projects', { token: visitorToken });
    expect(catalogRes.status).toBe(200);
    expect(Array.isArray(catalogRes.data)).toBe(true);
  });

  it('4.8 - Journey Step 8: Visitor inspects in-depth project technical specifications', async () => {
    if (!visitorToken) return;
    const targetId = sampleProjectId || 1;
    const detailRes = await api.get(`/api/projects/${targetId}`, { token: visitorToken });
    if (detailRes.status === 200) {
      expect(detailRes.data.id).toBe(targetId);
      expect(detailRes.data.title).toBeDefined();
      expect(detailRes.data.description).toBeDefined();
    } else {
      expect(detailRes.status).toBe(404);
    }
  });
});
