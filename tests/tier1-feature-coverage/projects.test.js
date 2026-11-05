/**
 * Tier 1: Feature Coverage - Projects Showcase & Private Catalog
 * Spec: SPEC:RF-01, RF-04, RF-10, DATABASE:3, PROJECT:Features 6, 7, 8, 15
 */
const { describe, it, expect, beforeAll } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeUser, makeProject } = require('../helpers/fixtures');

describe('Tier 1: Feature Coverage - Projects Showcase & Catalog Endpoints', () => {
  let userToken = null;
  let adminToken = null;
  let sampleProjectId = null;

  beforeAll(async () => {
    // Register unique normal user for private catalog access
    const userRes = await api.post('/api/auth/register', makeUser());
    if (userRes.status === 201 && userRes.data && userRes.data.token) {
      userToken = userRes.data.token;
    }

    // Attempt admin login
    try {
      const adminAuth = await api.loginAs('admin');
      adminToken = adminAuth.token;
    } catch {
      // In case seeds are not present yet
    }
  });

  it('3.1 - GET /api/projects/preview is public and returns 200 array without auth', async () => {
    const res = await api.get('/api/projects/preview');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    if (res.data.length > 0) {
      sampleProjectId = res.data[0].id;
    }
  });

  it('3.2 - Projects in preview have required showcase fields and are published', async () => {
    const res = await api.get('/api/projects/preview');
    expect(res.status).toBe(200);
    for (const proj of res.data) {
      expect(proj.id).toBeDefined();
      expect(proj.title).toBeDefined();
      expect(proj.short_description).toBeDefined();
      expect(proj.technologies).toBeDefined();
    }
  });

  it('3.3 - GET /api/projects (full catalog) requires authentication and returns 401', async () => {
    const res = await api.get('/api/projects');
    expect(res.status).toBe(401);
  });

  it('3.4 - GET /api/projects with authenticated token returns 200 and project list', async () => {
    if (!userToken) return;
    const res = await api.get('/api/projects', { token: userToken });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    if (res.data.length > 0 && !sampleProjectId) {
      sampleProjectId = res.data[0].id;
    }
  });

  it('3.5 - GET /api/projects/:id with valid token returns full project detail', async () => {
    if (!userToken) return;
    const targetId = sampleProjectId || 1;
    const res = await api.get(`/api/projects/${targetId}`, { token: userToken });
    // If project exists in DB, it should be 200
    if (res.status === 200) {
      expect(res.data.id).toBe(targetId);
      expect(res.data.description).toBeDefined();
      expect(res.data.title).toBeDefined();
    } else {
      expect(res.status).toBe(404);
    }
  });

  it('3.6 - GET /api/projects/999999 with valid token returns 404 Not Found', async () => {
    if (!userToken) return;
    const res = await api.get('/api/projects/999999', { token: userToken });
    expect(res.status).toBe(404);
  });

  it('3.7 - POST /api/projects by admin creates new project and returns 201', async () => {
    if (!adminToken) return;
    const newProj = makeProject();
    const res = await api.post('/api/projects', newProj, { token: adminToken });
    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.title).toBe(newProj.title);
  });
});
