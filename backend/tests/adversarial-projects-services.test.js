// backend/tests/adversarial-projects-services.test.js
/**
 * Empirical Adversarial Test Harness for Milestone 2 (Projects & Services APIs)
 * Tests:
 * 1. SQL Injection attempts in project & service fields (prepared statement neutralization)
 * 2. Boundary & invalid IDs (non-existent, alphanumeric, negative, zero, massive numbers)
 * 3. Unpublished project leak check (is_published = 0, false, '0' across preview, catalog, detail)
 * 4. Lucide icon name validation (regex enforcement, invalid symbols, length limits)
 * 5. RBAC privilege boundaries for projects and services
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');
const { getDb } = require('../src/database/db');

describe('Empirical Adversarial Challenges: Projects & Services APIs (M2)', () => {
  let adminToken = null;
  let userToken = null;
  let operatorToken = null;
  const createdProjectIds = [];
  const createdServiceIds = [];

  before(async () => {
    // 1. Admin authentication
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@portfolio.local', password: 'admin123' });
    assert.strictEqual(adminLogin.status, 200, 'Admin login must succeed');
    adminToken = adminLogin.body.token;

    // 2. Normal user registration
    const userSuffix = Date.now();
    const userReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: `Adversarial User ${userSuffix}`,
        email: `adv_user_${userSuffix}@test.local`,
        password: 'Password123!'
      });
    assert.strictEqual(userReg.status, 201, 'User registration must succeed');
    userToken = userReg.body.token;

    // 3. Operator authentication
    const opLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operador@portfolio.local', password: 'operador123' });
    if (opLogin.status === 200 && opLogin.body.token) {
      operatorToken = opLogin.body.token;
    }
  });

  after(async () => {
    // Clean up created resources
    const db = getDb();
    for (const pid of createdProjectIds) {
      try {
        db.prepare('DELETE FROM projects WHERE id = ?').run(pid);
      } catch {}
    }
    for (const sid of createdServiceIds) {
      try {
        db.prepare('DELETE FROM services WHERE id = ?').run(sid);
      } catch {}
    }
  });

  // =========================================================================
  // CHALLENGE 1: SQL Injection Attacks & Parameter Tampering
  // =========================================================================
  describe('Challenge 1: SQL Injection Stress Testing', () => {
    it('Neutralizes SQL injection in POST /api/projects fields without dropping tables', async () => {
      const db = getDb();
      const usersBefore = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      assert.ok(usersBefore > 0, 'Users table must have records before injection test');

      const sqliPayload = {
        title: "'; DROP TABLE users; --",
        description: "' OR 1=1 --",
        short_description: "admin' --",
        technologies: "['React', '; DROP TABLE users; --']",
        image_url: "https://evil.local/'; DELETE FROM projects; --",
        demo_url: "https://demo.local/' OR '1'='1",
        repository_url: "https://repo.local/'; --",
        is_published: 1
      };

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sqliPayload)
        .expect(201);

      assert.ok(res.body.id, 'Project created safely via prepared statements');
      createdProjectIds.push(res.body.id);

      // Verify users table was NOT dropped
      const usersAfter = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      assert.strictEqual(usersAfter, usersBefore, 'Users table MUST remain intact after SQL injection attack');

      // Verify the title was stored as a literal string
      assert.strictEqual(res.body.title, "'; DROP TABLE users; --");

      // Verify detail endpoint returns the literal payload safely
      const detailRes = await request(app)
        .get(`/api/projects/${res.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      assert.strictEqual(detailRes.body.title, "'; DROP TABLE users; --");
      assert.strictEqual(detailRes.body.description, "' OR 1=1 --");
    });

    it('Neutralizes SQL injection in PUT /api/projects/:id fields', async () => {
      const db = getDb();
      const usersBefore = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

      const targetId = createdProjectIds[0];
      const updatePayload = {
        title: "Updated'; DROP TABLE users; --",
        description: "Updated' OR '1'='1' --"
      };

      const res = await request(app)
        .put(`/api/projects/${targetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload)
        .expect(200);

      const usersAfter = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      assert.strictEqual(usersAfter, usersBefore, 'Users table MUST remain intact after PUT injection attack');
      assert.strictEqual(res.body.title, "Updated'; DROP TABLE users; --");
    });

    it('Neutralizes SQL injection in POST /api/services fields', async () => {
      const db = getDb();
      const usersBefore = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

      const serviceSqli = {
        title: "Service'; DROP TABLE users; --",
        description: "' OR 'a'='a'; --",
        icon: 'Server',
        is_published: 1
      };

      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(serviceSqli)
        .expect(201);

      assert.ok(res.body.id);
      createdServiceIds.push(res.body.id);

      const usersAfter = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      assert.strictEqual(usersAfter, usersBefore, 'Users table intact after Service injection attack');
      assert.strictEqual(res.body.title, "Service'; DROP TABLE users; --");
    });

    it('Rejects SQL injection in Service icon field via Lucide regex', async () => {
      const iconSqli = {
        title: 'Icon Injection Attempt',
        description: 'Testing icon injection',
        icon: "Code'; DROP TABLE services; --",
        is_published: 1
      };

      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(iconSqli)
        .expect(400);

      assert.ok(res.body.error, 'Icon SQL injection must be rejected with 400 Bad Request');
    });
  });

  // =========================================================================
  // CHALLENGE 2: Boundary & Invalid IDs Stress Testing
  // =========================================================================
  describe('Challenge 2: Boundary & Invalid IDs', () => {
    const invalidIds = [
      '9999999',
      'abc',
      'not-an-id',
      '-1',
      '-9999',
      '0',
      '0x10',
      '1e30',
      '99999999999999999999999999999999'
    ];

    for (const badId of invalidIds) {
      it(`GET /api/projects/${badId} returns 404 gracefully without crash`, async () => {
        const res = await request(app)
          .get(`/api/projects/${badId}`)
          .set('Authorization', `Bearer ${userToken}`);
        assert.ok([400, 404].includes(res.status), `Expected 400 or 404, got ${res.status}`);
        assert.ok(res.body.error);
      });

      it(`PUT /api/projects/${badId} returns 404 gracefully`, async () => {
        const res = await request(app)
          .put(`/api/projects/${badId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'New Title' });
        assert.ok([400, 404].includes(res.status), `Expected 400 or 404, got ${res.status}`);
        assert.ok(res.body.error);
      });

      it(`DELETE /api/projects/${badId} returns 404 gracefully`, async () => {
        const res = await request(app)
          .delete(`/api/projects/${badId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        assert.ok([400, 404].includes(res.status), `Expected 400 or 404, got ${res.status}`);
        assert.ok(res.body.error);
      });

      it(`PUT /api/services/${badId} returns 404 gracefully`, async () => {
        const res = await request(app)
          .put(`/api/services/${badId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'New Title' });
        assert.ok([400, 404].includes(res.status), `Expected 400 or 404, got ${res.status}`);
        assert.ok(res.body.error);
      });

      it(`DELETE /api/services/${badId} returns 404 gracefully`, async () => {
        const res = await request(app)
          .delete(`/api/services/${badId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        assert.ok([400, 404].includes(res.status), `Expected 400 or 404, got ${res.status}`);
        assert.ok(res.body.error);
      });
    }
  });

  // =========================================================================
  // CHALLENGE 3: Project Preview Leak Check (Unpublished / Draft Isolation)
  // =========================================================================
  describe('Challenge 3: Unpublished Project Isolation & Preview Leak Check', () => {
    let unpubId0 = null;
    let unpubIdFalse = null;
    let pubId = null;

    before(async () => {
      // 1. Create project with is_published = 0
      const res0 = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Secret Unpublished Zero ${Date.now()}`,
          short_description: 'Draft not ready for public',
          description: 'Top secret project details that must never leak.',
          technologies: 'Solidity, Rust',
          is_published: 0
        });
      assert.strictEqual(res0.status, 201);
      unpubId0 = res0.body.id;
      createdProjectIds.push(unpubId0);

      // 2. Create project with is_published = false
      const resFalse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Secret Unpublished False ${Date.now()}`,
          short_description: 'Draft false not ready',
          description: 'Top secret boolean false draft.',
          technologies: 'Go, Docker',
          is_published: false
        });
      assert.strictEqual(resFalse.status, 201);
      unpubIdFalse = resFalse.body.id;
      createdProjectIds.push(unpubIdFalse);

      // 3. Create published project
      const resPub = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Public Published Project ${Date.now()}`,
          short_description: 'Published and ready',
          description: 'Publicly visible project description.',
          technologies: 'React, Node.js',
          is_published: 1
        });
      assert.strictEqual(resPub.status, 201);
      pubId = resPub.body.id;
      createdProjectIds.push(pubId);
    });

    it('GET /api/projects/preview NEVER leaks unpublished projects to anonymous public', async () => {
      const res = await request(app)
        .get('/api/projects/preview')
        .expect(200);

      assert.ok(Array.isArray(res.body));
      const returnedIds = res.body.map(p => p.id);

      assert.ok(returnedIds.includes(pubId), 'Public project must be present');
      assert.ok(!returnedIds.includes(unpubId0), 'Unpublished project (0) MUST NOT be in preview');
      assert.ok(!returnedIds.includes(unpubIdFalse), 'Unpublished project (false) MUST NOT be in preview');

      // Every returned item must have is_published === 1
      for (const p of res.body) {
        assert.strictEqual(p.is_published, 1, 'Only published items allowed in preview');
      }
    });

    it('GET /api/projects without token is rejected with 401', async () => {
      await request(app)
        .get('/api/projects')
        .expect(401);
    });

    it('GET /api/projects NEVER leaks unpublished projects to normal authenticated users', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      assert.ok(Array.isArray(res.body));
      const returnedIds = res.body.map(p => p.id);

      assert.ok(returnedIds.includes(pubId), 'Published project must be in catalog');
      assert.ok(!returnedIds.includes(unpubId0), 'Unpublished project (0) MUST NOT be in normal catalog');
      assert.ok(!returnedIds.includes(unpubIdFalse), 'Unpublished project (false) MUST NOT be in normal catalog');
    });

    it('GET /api/projects?all=true parameter tampering by normal user does NOT leak drafts', async () => {
      const res = await request(app)
        .get('/api/projects?all=true')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const returnedIds = res.body.map(p => p.id);
      assert.ok(!returnedIds.includes(unpubId0), 'Normal user ?all=true MUST NOT return unpublished draft (0)');
      assert.ok(!returnedIds.includes(unpubIdFalse), 'Normal user ?all=true MUST NOT return unpublished draft (false)');
    });

    it('GET /api/projects/:id for unpublished project returns 404 to normal user', async () => {
      const res = await request(app)
        .get(`/api/projects/${unpubId0}`)
        .set('Authorization', `Bearer ${userToken}`);
      assert.strictEqual(res.status, 404, 'Normal user must receive 404 for unpublished project');
    });

    it('GET /api/projects/:id for unpublished project returns 404 to operator', async () => {
      if (!operatorToken) return;
      const res = await request(app)
        .get(`/api/projects/${unpubId0}`)
        .set('Authorization', `Bearer ${operatorToken}`);
      assert.strictEqual(res.status, 404, 'Operator must receive 404 for unpublished project');
    });

    it('GET /api/projects/:id for unpublished project returns 200 to administrator', async () => {
      const res = await request(app)
        .get(`/api/projects/${unpubId0}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      assert.strictEqual(res.body.id, unpubId0);
      assert.strictEqual(res.body.is_published, 0);
    });

    it('GET /api/projects?all=true returns unpublished projects to administrator', async () => {
      const res = await request(app)
        .get('/api/projects?all=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const returnedIds = res.body.map(p => p.id);
      assert.ok(returnedIds.includes(unpubId0), 'Admin ?all=true must include draft 0');
      assert.ok(returnedIds.includes(unpubIdFalse), 'Admin ?all=true must include draft false');
    });

    it('GET /api/services NEVER leaks unpublished services', async () => {
      // Create unpublished service
      const unpubSrv = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Secret Unpublished Service ${Date.now()}`,
          description: 'Draft service description',
          icon: 'Database',
          is_published: 0
        })
        .expect(201);
      createdServiceIds.push(unpubSrv.body.id);

      const res = await request(app)
        .get('/api/services')
        .expect(200);

      const returnedIds = res.body.map(s => s.id);
      assert.ok(!returnedIds.includes(unpubSrv.body.id), 'Unpublished service must not appear in public services list');
    });
  });

  // =========================================================================
  // CHALLENGE 4: Service Creation & Lucide Icon Name Validation
  // =========================================================================
  describe('Challenge 4: Lucide Icon Validation Stress Testing', () => {
    const invalidIcons = [
      'invalid-icon-123',
      'lowercaseIcon',
      'code',
      'server',
      'Icon with spaces',
      'Icon!',
      'Icon@#$',
      '<script>alert(1)</script>',
      'A',
      '123Icon',
      'icon_with_underscore',
      'A' + 'B'.repeat(50) // too long (> 41 chars)
    ];

    for (const badIcon of invalidIcons) {
      it(`Rejects invalid Lucide icon "${badIcon.substring(0, 20)}" with 400 Bad Request on POST`, async () => {
        const res = await request(app)
          .post('/api/services')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Test Service',
            description: 'Testing icon validation',
            icon: badIcon,
            is_published: 1
          });
        assert.strictEqual(res.status, 400, `Expected 400 for bad icon "${badIcon}", got ${res.status}`);
        assert.ok(res.body.error);
      });
    }

    const validIcons = ['Code', 'Server', 'Database', 'Layout', 'Cpu', 'FolderGit2'];

    for (const goodIcon of validIcons) {
      it(`Accepts valid Lucide icon "${goodIcon}" with 201 Created on POST`, async () => {
        const res = await request(app)
          .post('/api/services')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: `Valid Service ${goodIcon} ${Date.now()}`,
            description: `Testing valid icon ${goodIcon}`,
            icon: goodIcon,
            is_published: 1
          });
        assert.strictEqual(res.status, 201, `Expected 201 for valid icon "${goodIcon}", got ${res.status}`);
        assert.strictEqual(res.body.icon, goodIcon);
        createdServiceIds.push(res.body.id);
      });
    }

    it('Rejects invalid Lucide icon on PUT /api/services/:id with 400', async () => {
      const targetId = createdServiceIds[0];
      const res = await request(app)
        .put(`/api/services/${targetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ icon: 'invalid-icon-name' });
      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error);
    });

    it('Accepts valid Lucide icon on PUT /api/services/:id with 200', async () => {
      const targetId = createdServiceIds[0];
      const res = await request(app)
        .put(`/api/services/${targetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ icon: 'Cpu' })
        .expect(200);
      assert.strictEqual(res.body.icon, 'Cpu');
    });
  });

  // =========================================================================
  // CHALLENGE 5: RBAC & Privilege Escalation Boundary Testing
  // =========================================================================
  describe('Challenge 5: RBAC & Privilege Escalation Boundaries', () => {
    it('Normal user cannot POST /api/projects (403 Forbidden)', async () => {
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Hacker Project',
          short_description: 'Exploit',
          description: 'Hacking admin route',
          technologies: 'None'
        })
        .expect(403);
    });

    it('Normal user cannot PUT /api/projects/:id (403 Forbidden)', async () => {
      const targetId = createdProjectIds[0] || 1;
      await request(app)
        .put(`/api/projects/${targetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Overwritten Project' })
        .expect(403);
    });

    it('Normal user cannot DELETE /api/projects/:id (403 Forbidden)', async () => {
      const targetId = createdProjectIds[0] || 1;
      await request(app)
        .delete(`/api/projects/${targetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('Normal user cannot POST /api/services (403 Forbidden)', async () => {
      await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Hacker Service',
          description: 'Exploit service',
          icon: 'Code'
        })
        .expect(403);
    });

    it('Normal user cannot PUT /api/services/:id (403 Forbidden)', async () => {
      const targetId = createdServiceIds[0] || 1;
      await request(app)
        .put(`/api/services/${targetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Overwritten Service' })
        .expect(403);
    });

    it('Normal user cannot DELETE /api/services/:id (403 Forbidden)', async () => {
      const targetId = createdServiceIds[0] || 1;
      await request(app)
        .delete(`/api/services/${targetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
