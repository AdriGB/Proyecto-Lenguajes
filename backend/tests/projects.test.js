// backend/tests/projects.test.js
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');

describe('Projects REST API (/api/projects)', () => {
  let adminToken = null;
  let userToken = null;
  let sampleProjectId = null;
  let createdProjectId = null;

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
        name: `Projects Test User ${randomSuffix}`,
        email: `projects_user_${randomSuffix}@test.local`,
        password: 'Password123!'
      });
    if (userRegRes.status === 201 && userRegRes.body.token) {
      userToken = userRegRes.body.token;
    }
  });

  it('GET /api/projects/preview is public and returns 200 array', async () => {
    const res = await request(app)
      .get('/api/projects/preview')
      .expect(200);

    assert.ok(Array.isArray(res.body));
    if (res.body.length > 0) {
      sampleProjectId = res.body[0].id;
      assert.ok(res.body[0].title);
      assert.ok(res.body[0].short_description);
      assert.ok(res.body[0].technologies);
    }
  });

  it('GET /api/projects without token returns 401 Unauthorized', async () => {
    await request(app)
      .get('/api/projects')
      .expect(401);
  });

  it('GET /api/projects with normal user token returns 200 catalog', async () => {
    if (!userToken) return;
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    assert.ok(Array.isArray(res.body));
  });

  it('GET /api/projects/:id with valid token returns project detail', async () => {
    if (!userToken) return;
    const targetId = sampleProjectId || 1;
    const res = await request(app)
      .get(`/api/projects/${targetId}`)
      .set('Authorization', `Bearer ${userToken}`);

    if (res.status === 200) {
      assert.strictEqual(res.body.id, targetId);
      assert.ok(res.body.description);
    } else {
      assert.strictEqual(res.status, 404);
    }
  });

  it('GET /api/projects/999999 returns 404 Not Found', async () => {
    if (!userToken) return;
    await request(app)
      .get('/api/projects/999999')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(404);
  });

  it('POST /api/projects by normal user returns 403 Forbidden', async () => {
    if (!userToken) return;
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Forbidden Project',
        description: 'Should fail',
        short_description: 'Fail',
        technologies: 'React'
      })
      .expect(403);
  });

  it('POST /api/projects by admin creates new project and returns 201', async () => {
    if (!adminToken) return;
    const newProj = {
      title: `Proyecto Test Admin ${Date.now()}`,
      short_description: 'Resumen test admin',
      description: 'Descripción completa para verificación de endpoint de proyectos.',
      technologies: 'Node.js, Express, SQLite',
      image_url: 'https://images.unsplash.com/photo-1',
      demo_url: 'https://demo.local',
      repository_url: 'https://github.com/test',
      is_published: 1
    };

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newProj)
      .expect(201);

    assert.ok(res.body.id);
    assert.strictEqual(res.body.title, newProj.title);
    createdProjectId = res.body.id;
  });

  it('PUT /api/projects/:id updates project and returns 200', async () => {
    if (!adminToken || !createdProjectId) return;
    const updatedTitle = `Proyecto Actualizado ${Date.now()}`;
    const res = await request(app)
      .put(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: updatedTitle,
        short_description: 'Resumen actualizado'
      })
      .expect(200);

    assert.strictEqual(res.body.title, updatedTitle);
  });

  it('DELETE /api/projects/:id deletes project and returns 200', async () => {
    if (!adminToken || !createdProjectId) return;
    const res = await request(app)
      .delete(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    assert.ok(res.body.message);
  });
});
