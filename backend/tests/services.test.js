// backend/tests/services.test.js
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');

describe('Services REST API (/api/services)', () => {
  let adminToken = null;
  let userToken = null;
  let createdServiceId = null;

  before(async () => {
    // Obtain admin token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@portfolio.local', password: 'admin123' });
    if (adminLoginRes.status === 200 && adminLoginRes.body.token) {
      adminToken = adminLoginRes.body.token;
    }

    // Register & obtain normal user token
    const randomSuffix = Date.now();
    const userRegRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: `Service Test User ${randomSuffix}`,
        email: `service_user_${randomSuffix}@test.local`,
        password: 'Password123!'
      });
    if (userRegRes.status === 201 && userRegRes.body.token) {
      userToken = userRegRes.body.token;
    }
  });

  it('GET /api/services is public and returns 200 array of active services', async () => {
    const res = await request(app)
      .get('/api/services')
      .expect(200);

    assert.ok(Array.isArray(res.body), 'Response must be an array');
    if (res.body.length > 0) {
      const srv = res.body[0];
      assert.ok(srv.id, 'Service should have id');
      assert.ok(srv.title, 'Service should have title');
      assert.ok(srv.description, 'Service should have description');
      assert.ok(srv.icon, 'Service should have icon');
      assert.strictEqual(srv.is_published, 1, 'Only published services should be returned');
    }
  });

  it('POST /api/services by unauthenticated user returns 401 or 403', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({
        title: 'Unauth Service',
        description: 'Should fail',
        icon: 'Code'
      });

    assert.ok([401, 403].includes(res.status), `Expected 401 or 403, got ${res.status}`);
  });

  it('POST /api/services by normal user returns 403 Forbidden', async () => {
    if (!userToken) return;
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Normal User Service',
        description: 'Should be rejected',
        icon: 'Code'
      })
      .expect(403);

    assert.ok(res.body.error);
  });

  it('POST /api/services with missing fields returns 400 Bad Request', async () => {
    if (!adminToken) return;
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400);

    assert.ok(res.body.error);
  });

  it('POST /api/services with invalid icon name returns 400 Bad Request', async () => {
    if (!adminToken) return;
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Invalid Icon Service',
        description: 'Description',
        icon: '123_invalid_icon!'
      })
      .expect(400);

    assert.ok(res.body.error);
  });

  it('POST /api/services by admin creates a new service and returns 201', async () => {
    if (!adminToken) return;
    const servicePayload = {
      title: `Servicio Unit Test ${Date.now()}`,
      description: 'Descripción de prueba unitaria para validar creación de servicio.',
      icon: 'Cpu',
      is_published: 1
    };

    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(servicePayload)
      .expect(201);

    assert.ok(res.body.id, 'Created service should have an id');
    assert.strictEqual(res.body.title, servicePayload.title);
    assert.strictEqual(res.body.icon, 'Cpu');
    createdServiceId = res.body.id;
  });

  it('PUT /api/services/:id updates service and returns 200', async () => {
    if (!adminToken || !createdServiceId) return;
    const updatedTitle = `Servicio Modificado ${Date.now()}`;

    const res = await request(app)
      .put(`/api/services/${createdServiceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: updatedTitle,
        description: 'Descripción modificada con éxito',
        icon: 'Server'
      })
      .expect(200);

    assert.strictEqual(res.body.title, updatedTitle);
    assert.strictEqual(res.body.icon, 'Server');
  });

  it('PUT /api/services/999999 returns 404 Not Found', async () => {
    if (!adminToken) return;
    const res = await request(app)
      .put('/api/services/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Ghost Service' })
      .expect(404);

    assert.ok(res.body.error);
  });

  it('DELETE /api/services/:id by admin deletes service and returns 200', async () => {
    if (!adminToken || !createdServiceId) return;
    const res = await request(app)
      .delete(`/api/services/${createdServiceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    assert.ok(res.body.message);
  });

  it('DELETE /api/services/999999 returns 404 Not Found', async () => {
    if (!adminToken) return;
    const res = await request(app)
      .delete('/api/services/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    assert.ok(res.body.error);
  });
});
