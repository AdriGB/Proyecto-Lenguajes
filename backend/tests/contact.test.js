// backend/tests/contact.test.js
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');

describe('Contact REST API (/api/contact)', () => {
  let userToken = null;
  let userId = null;

  before(async () => {
    const randomSuffix = Date.now();
    const userRegRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: `Contact Test User ${randomSuffix}`,
        email: `contact_user_${randomSuffix}@test.local`,
        password: 'Password123!'
      });
    if (userRegRes.status === 201 && userRegRes.body.token) {
      userToken = userRegRes.body.token;
      userId = userRegRes.body.user.id;
    }
  });

  it('POST /api/contact allows guest visitor submission and returns 201', async () => {
    const inquiry = {
      name: 'Visitante Invitado',
      email: 'invitado@correo.com',
      inquiry_type: 'Presupuesto',
      message: 'Consulta de cotización para nuevo proyecto fullstack.'
    };

    const res = await request(app)
      .post('/api/contact')
      .send(inquiry)
      .expect(201);

    assert.ok(res.body.success || res.body.id);
    assert.strictEqual(res.body.status, 'pendiente');
    if (res.body.id) {
      assert.ok(typeof res.body.id === 'number');
    }
  });

  it('POST /api/contact with valid Bearer token links user_id', async () => {
    if (!userToken || !userId) return;

    const inquiry = {
      name: 'Usuario Registrado',
      email: 'registrado@correo.com',
      inquiry_type: 'Consulta técnica',
      message: 'Consulta técnica realizada desde sesión activa.'
    };

    const res = await request(app)
      .post('/api/contact')
      .set('Authorization', `Bearer ${userToken}`)
      .send(inquiry)
      .expect(201);

    assert.ok(res.body.success || res.body.id);
    assert.strictEqual(res.body.user_id, userId);
  });

  it('POST /api/contact with empty payload returns 400 Bad Request', async () => {
    await request(app)
      .post('/api/contact')
      .send({})
      .expect(400);
  });

  it('POST /api/contact with missing fields returns 400 Bad Request', async () => {
    // Missing message
    await request(app)
      .post('/api/contact')
      .send({
        name: 'Incompleto',
        email: 'incompleto@correo.com',
        inquiry_type: 'Colaboración'
      })
      .expect(400);

    // Missing email
    await request(app)
      .post('/api/contact')
      .send({
        name: 'Sin Email',
        inquiry_type: 'Colaboración',
        message: 'Texto mensaje'
      })
      .expect(400);

    // Missing inquiry_type
    await request(app)
      .post('/api/contact')
      .send({
        name: 'Sin Tipo',
        email: 'tipo@correo.com',
        message: 'Texto mensaje'
      })
      .expect(400);
  });

  it('POST /api/contact with malformed email returns 400 Bad Request', async () => {
    const badEmails = ['invalid-email', 'missing@domain', '@nodomain.com', 'spaces in@email.com'];
    for (const badEmail of badEmails) {
      await request(app)
        .post('/api/contact')
        .send({
          name: 'Validador',
          email: badEmail,
          inquiry_type: 'Presupuesto',
          message: 'Validando formato email'
        })
        .expect(400);
    }
  });
});
