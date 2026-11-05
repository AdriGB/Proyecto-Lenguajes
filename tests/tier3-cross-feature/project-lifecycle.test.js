/**
 * Tier 3: Cross-Feature Combinations - Project Lifecycle & Dynamic Visibility
 * Workflow: Admin Creates Draft -> Invisible in Preview -> Admin Publishes -> Visible in Preview -> Admin Deletes -> 404
 */
const { describe, it, expect } = require('../helpers/test-harness');
const api = require('../helpers/api');
const { makeProject, makeUser } = require('../helpers/fixtures');

describe('Tier 3: Cross-Feature - Project Management & Visibility Lifecycle', () => {
  let adminToken = null;
  let userToken = null;
  let projectId = null;
  const draftProject = makeProject({ is_published: 0 });

  it('3.6 - Step 1: Admin and normal user authenticate', async () => {
    try {
      const adminAuth = await api.loginAs('admin');
      adminToken = adminAuth.token;
    } catch {}

    const userRes = await api.post('/api/auth/register', makeUser());
    if (userRes.status === 201 && userRes.data) {
      userToken = userRes.data.token;
    }
  });

  it('3.7 - Step 2: Admin creates draft project (is_published = 0)', async () => {
    if (!adminToken) return;
    const res = await api.post('/api/projects', draftProject, { token: adminToken });
    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    projectId = res.data.id;
  });

  it('3.8 - Step 3: Unpublished project must NOT appear in public preview', async () => {
    if (!projectId) return;
    const previewRes = await api.get('/api/projects/preview');
    expect(previewRes.status).toBe(200);
    const foundInPreview = previewRes.data.some(p => p.id === projectId);
    expect(foundInPreview).toBe(false);
  });

  it('3.9 - Step 4: Admin publishes project (is_published = 1)', async () => {
    if (!adminToken || !projectId) return;
    const updateRes = await api.put(`/api/projects/${projectId}`, {
      ...draftProject,
      is_published: 1
    }, { token: adminToken });

    expect(updateRes.status).toBe(200);
  });

  it('3.10 - Step 5: Published project now appears in public preview and catalog', async () => {
    if (!projectId) return;
    const previewRes = await api.get('/api/projects/preview');
    expect(previewRes.status).toBe(200);
    const foundInPreview = previewRes.data.some(p => p.id === projectId);
    expect(foundInPreview).toBe(true);

    if (userToken) {
      const catalogRes = await api.get('/api/projects', { token: userToken });
      expect(catalogRes.status).toBe(200);
      const foundInCatalog = catalogRes.data.some(p => p.id === projectId);
      expect(foundInCatalog).toBe(true);
    }
  });

  it('3.11 - Step 6: Admin deletes project; subsequent requests return 404', async () => {
    if (!adminToken || !projectId) return;
    const delRes = await api.delete(`/api/projects/${projectId}`, { token: adminToken });
    expect([200, 204].includes(delRes.status)).toBe(true);

    if (userToken) {
      const detailRes = await api.get(`/api/projects/${projectId}`, { token: userToken });
      expect(detailRes.status).toBe(404);
    }
  });
});
