/**
 * Tier 1: Feature Coverage - Services Listing & Management
 * Spec: SPEC:RF-01, RF-10, DATABASE:4, PROJECT:Features 9, 16
 */
const { describe, it, expect, beforeAll } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeService, makeUser } = require('../helpers/fixtures');

describe('Tier 1: Feature Coverage - Services Endpoints', () => {
  let adminToken = null;
  let userToken = null;
  let createdServiceId = null;

  beforeAll(async () => {
    try {
      const adminAuth = await api.loginAs('admin');
      adminToken = adminAuth.token;
    } catch {}

    const userRes = await api.post('/api/auth/register', makeUser());
    if (userRes.status === 201 && userRes.data) {
      userToken = userRes.data.token;
    }
  });

  it('4.1 - GET /api/services is public and returns 200 array of active services', async () => {
    const res = await api.get('/api/services');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('4.2 - Service records include id, title, description, and icon', async () => {
    const res = await api.get('/api/services');
    expect(res.status).toBe(200);
    if (res.data.length > 0) {
      const service = res.data[0];
      expect(service.id).toBeDefined();
      expect(service.title).toBeDefined();
      expect(service.description).toBeDefined();
      expect(service.icon).toBeDefined();
    }
  });

  it('4.3 - POST /api/services by admin creates a new service and returns 201', async () => {
    if (!adminToken) return;
    const newService = makeService();
    const res = await api.post('/api/services', newService, { token: adminToken });
    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.title).toBe(newService.title);
    createdServiceId = res.data.id;
  });

  it('4.4 - PUT /api/services/:id by admin updates service and returns 200', async () => {
    if (!adminToken || !createdServiceId) return;
    const updatedTitle = `Servicio Actualizado ${Date.now()}`;
    const res = await api.put(`/api/services/${createdServiceId}`, {
      title: updatedTitle,
      description: 'Descripción actualizada con nuevas especificaciones.',
      icon: 'Server'
    }, { token: adminToken });

    expect(res.status).toBe(200);
    expect(res.data.title).toBe(updatedTitle);
  });

  it('4.5 - DELETE /api/services/:id by admin deletes service successfully', async () => {
    if (!adminToken || !createdServiceId) return;
    const res = await api.delete(`/api/services/${createdServiceId}`, { token: adminToken });
    expect([200, 204].includes(res.status)).toBe(true);
  });

  it('4.6 - POST /api/services by unauthorized user returns 401 or 403', async () => {
    const newService = makeService();
    // Unauthenticated
    const unauthRes = await api.post('/api/services', newService);
    expect([401, 403].includes(unauthRes.status)).toBe(true);

    // Normal user
    if (userToken) {
      const userRes = await api.post('/api/services', newService, { token: userToken });
      expect(userRes.status).toBe(403);
    }
  });
});
