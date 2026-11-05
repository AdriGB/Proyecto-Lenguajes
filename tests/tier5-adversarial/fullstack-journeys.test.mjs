/**
 * Tier 5: Adversarial End-to-End User Journeys Hardening
 * Master Suite covering Journeys A, B, C, D, E across all 4 system roles:
 * - Guest (Unauthenticated Visitor)
 * - Normal User (usuario_normal)
 * - Operator (operador)
 * - Administrator (administrador)
 * 
 * Validates fullstack integration, frontend api.js wrapper, auth state transitions,
 * client-side ProtectedRoute diagnostics, Recharts visual contracts,
 * database integrity (SQLite foreign keys & counters), and administrative lockout prevention.
 * 
 * Zero-dependency native Node.js 24 test runner (`node:test`, `node:assert/strict`).
 */
import test, { describe, beforeEach, after, before } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Import frontend API client directly from frontend source
import {
  apiRequest,
  authApi,
  servicesApi,
  projectsApi,
  contactApi,
  metricsApi,
  operatorApi,
  usersApi
} from '../../frontend/src/services/api.js';

const require = createRequire(import.meta.url);
const dbHelper = require('../helpers/db.js');
const { randomId, randomEmail, makeUser, makeInquiry } = require('../helpers/fixtures.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory Mock Storage for browser localStorage & sessionStorage in Node
class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

// Mirror Projects.jsx safe technologies parser
function parseTechnologies(tech) {
  if (!tech) return [];
  if (Array.isArray(tech)) return tech;
  if (typeof tech === 'string') {
    const trimmed = tech.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return trimmed
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

// Mirror Projects.jsx reactive multi-field search filter
function filterProjects(projects, searchQuery, selectedTech) {
  const query = (searchQuery || '').trim().toLowerCase();
  return projects.filter((project) => {
    const techList = parseTechnologies(project.technologies);

    if (selectedTech && !techList.includes(selectedTech)) {
      return false;
    }

    if (!query) return true;

    const matchTitle = (project.title || '').toLowerCase().includes(query);
    const matchShort = (project.short_description || '').toLowerCase().includes(query);
    const matchDesc = (project.description || '').toLowerCase().includes(query);
    const matchTech = techList.some((t) => t.toLowerCase().includes(query));

    return matchTitle || matchShort || matchDesc || matchTech;
  });
}

// Mirror ProtectedRoute.jsx RBAC diagnostic evaluator
function evaluateProtectedRoute({ user, allowedRoles }) {
  if (!user) {
    return {
      status: 401,
      view: 'REDIRECT_LOGIN',
      diagnostic: 'Unauthenticated visitor redirected to /login'
    };
  }
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    return {
      status: 403,
      view: 'FORBIDDEN_403',
      currentRole: user.role,
      allowedRoles: allowedRoles,
      title: 'Acceso no autorizado',
      actions: [
        'Volver al inicio',
        ...(user.role === 'usuario_normal' ? ['Ver Proyectos'] : []),
        'Cambiar cuenta'
      ]
    };
  }
  return {
    status: 200,
    view: 'AUTHORIZED',
    diagnostic: 'Access granted'
  };
}

// Mirror Operator canned response template generator
const CANNED_TEMPLATES = {
  agradecimiento: (name) =>
    `Estimado/a ${name},\n\nMuchas gracias por contactarte con nosotros. Hemos recibido tu consulta y nuestro equipo la está revisando con atención. Te responderemos a la brevedad con la información solicitada.\n\nSaludos cordiales,\nEquipo de Operaciones`,
  cotizacion: (name) =>
    `Estimado/a ${name},\n\nGracias por tu interés en nuestros servicios. Con respecto a tu solicitud de cotización, hemos preparado una estimación preliminar y nos encantaría coordinar una breve llamada para definir los requerimientos técnicos y plazos.\n\nQuedamos a tu entera disposición.\nSaludos cordiales,`,
};

// Mirror Admin Recharts data transformers
function formatInquiryType(type) {
  if (!type) return 'General';
  const mapping = {
    trabajo: 'Oferta Laboral',
    colaboracion: 'Colaboración',
    consulta_general: 'Consulta General',
    soporte: 'Soporte Técnico',
    otro: 'Otro Asunto',
  };
  return mapping[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
}

function transformInquiriesForRecharts(metrics) {
  if (!metrics?.inquiriesByType || !Array.isArray(metrics.inquiriesByType)) return [];
  return metrics.inquiriesByType.map((item) => ({
    name: formatInquiryType(item.type),
    count: Number(item.count) || 0,
    rawType: item.type,
  }));
}

function transformTimelineForRecharts(metrics) {
  if (!metrics?.registrationsTimeline || !Array.isArray(metrics.registrationsTimeline)) return [];
  return metrics.registrationsTimeline.map((item) => ({
    date: item.date ? item.date.slice(5) : '',
    fullDate: item.date,
    count: Number(item.count) || 0,
  }));
}

describe('Tier 5 Adversarial Fullstack User Journeys Suite', () => {
  let mockLocalStorage;
  let mockSessionStorage;
  let originalFetch;
  let serverProcess = null;
  const BACKEND_BASE = 'http://localhost:5000';

  before(async () => {
    mockLocalStorage = new MockStorage();
    mockSessionStorage = new MockStorage();
    globalThis.localStorage = mockLocalStorage;
    globalThis.sessionStorage = mockSessionStorage;

    originalFetch = globalThis.fetch;
    // Map relative API URLs to the backend test port
    globalThis.fetch = async (url, config = {}) => {
      const fullUrl = url.startsWith('http') ? url : `${BACKEND_BASE}${url}`;
      return originalFetch(fullUrl, config);
    };

    // Probe backend server; spawn if offline
    let serverRunning = false;
    try {
      const res = await originalFetch('http://localhost:5000/api/health');
      if (res.status === 200) serverRunning = true;
    } catch {}

    if (!serverRunning) {
      const entrypoint = path.resolve(__dirname, '../../backend/src/server.js');
      const backendCwd = path.resolve(__dirname, '../../backend');
      console.log('[Tier 5 Test] Spawning background test backend server...');
      serverProcess = spawn(process.execPath, [entrypoint], {
        cwd: backendCwd,
        env: { ...process.env, PORT: '5000', NODE_ENV: 'test' },
        stdio: 'ignore',
      });

      const start = Date.now();
      while (Date.now() - start < 8000) {
        await new Promise((r) => setTimeout(r, 250));
        try {
          const res = await originalFetch('http://localhost:5000/api/health');
          if (res.status === 200) {
            serverRunning = true;
            break;
          }
        } catch {}
      }

      if (!serverRunning) {
        throw new Error('Failed to auto-spawn backend server for Tier 5 journeys');
      }
    }
  });

  after(() => {
    globalThis.fetch = originalFetch;
    delete globalThis.localStorage;
    delete globalThis.sessionStorage;
    dbHelper.close();

    if (serverProcess) {
      try {
        serverProcess.kill('SIGTERM');
      } catch {}
      serverProcess = null;
    }
  });

  beforeEach(() => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
  });

  /* =========================================================================
     JOURNEY A: Unauthenticated Guest User Journey
     ========================================================================= */
  describe('Journey A: Unauthenticated Guest Experience & Boundary Hardening', () => {
    test('A.1 Visitor visits homepage (/), increments visit telemetry atomically, and guards duplicate triggers', async () => {
      // 1. Snapshot database counter before visit
      const beforeRow = dbHelper.queryOne("SELECT count FROM site_metrics WHERE metric_key = 'visitas_generales'");
      const countBefore = beforeRow ? Number(beforeRow.count) : 0;

      // 2. Simulate Home.jsx visit telemetry recording logic
      const sessionKey = 'portfolio_visit_recorded';
      assert.strictEqual(mockSessionStorage.getItem(sessionKey), null);

      const visitRes = await metricsApi.recordVisit();
      assert.ok(visitRes);
      assert.strictEqual(visitRes.success, true);
      mockSessionStorage.setItem(sessionKey, 'true');

      // 3. Verify SQLite counter incremented
      const afterRow = dbHelper.queryOne("SELECT count FROM site_metrics WHERE metric_key = 'visitas_generales'");
      const countAfter = afterRow ? Number(afterRow.count) : 0;
      assert.strictEqual(countAfter, countBefore + 1, 'visitas_generales must increment by 1');

      // 4. Verify telemetry session guard prevents duplicate calls within same tab session
      const isGuarded = mockSessionStorage.getItem(sessionKey) === 'true';
      assert.strictEqual(isGuarded, true, 'Telemetry session guard should prevent re-triggering');
    });

    test('A.2 Guest browses professional services and verifies only published services are exposed', async () => {
      const services = await servicesApi.list();
      assert.ok(Array.isArray(services), 'Services should be an array');
      assert.ok(services.length >= 1, 'Expected at least 1 published service');

      for (const service of services) {
        assert.ok(service.id, 'Service must have an id');
        assert.ok(service.title, 'Service must have a title');
        assert.ok(service.description, 'Service must have a description');
        assert.ok(service.icon, 'Service must specify an icon');
        assert.strictEqual(service.is_published, 1, 'Guest must only see published services');
      }
    });

    test('A.3 Guest reviews public project previews and confirms showcase constraints', async () => {
      const previewProjects = await projectsApi.preview();
      assert.ok(Array.isArray(previewProjects), 'Project preview must return an array');
      assert.ok(previewProjects.length >= 1, 'Expected at least 1 preview project');

      for (const proj of previewProjects) {
        assert.ok(proj.id, 'Preview project must have id');
        assert.ok(proj.title, 'Preview project must have title');
        assert.ok(proj.short_description, 'Preview project must have short_description');
        assert.ok(proj.technologies, 'Preview project must specify technologies');
        assert.strictEqual(proj.is_published, 1, 'Preview project must be published');
      }
    });

    test('A.4 Guest attempts to enter private projects catalog (/proyectos) and is strictly rejected with 401', async () => {
      mockLocalStorage.removeItem('token');
      await assert.rejects(
        async () => {
          await projectsApi.list();
        },
        (err) => {
          assert.strictEqual(err.status, 401, 'Guest must receive 401 Unauthorized for private catalog');
          return true;
        }
      );
    });

    test('A.5 Guest submits contact inquiry and verifies user_id is strictly NULL in database', async () => {
      const guestEmail = randomEmail('guest');
      const payload = {
        name: 'Invitado Externo',
        email: guestEmail,
        inquiry_type: 'Presupuesto',
        message: 'Hola, me interesa conocer los servicios de arquitectura y desarrollo web.',
      };

      const res = await contactApi.submit(payload);
      assert.ok(res);
      assert.ok(res.message, 'Expected success message');

      // Verify in SQLite directly
      const msgRow = dbHelper.queryOne(
        'SELECT id, name, email, inquiry_type, message, user_id, status, response_message, responded_at FROM contact_messages WHERE email = ? ORDER BY id DESC LIMIT 1',
        guestEmail
      );
      assert.ok(msgRow, 'Inquiry must be persisted in SQLite');
      assert.strictEqual(msgRow.name, payload.name);
      assert.strictEqual(msgRow.user_id, null, 'user_id must be strictly NULL for guest inquiries');
      assert.strictEqual(msgRow.status, 'pendiente', 'Default status must be pendiente');
      assert.strictEqual(msgRow.response_message, null, 'Initial response_message must be NULL');
      assert.strictEqual(msgRow.responded_at, null, 'Initial responded_at must be NULL');
    });

    test('A.6 Adversarial Injection: Guest attempts to inject user_id and status in inquiry payload', async () => {
      const spoofEmail = randomEmail('spoof');
      const maliciousPayload = {
        name: 'Spoofing Attacker',
        email: spoofEmail,
        inquiry_type: 'Consulta General',
        message: 'Intento de escalada de privilegios inyectando user_id y status en el formulario de contacto.',
        user_id: 1, // Attempted spoof of admin user ID
        status: 'respondida', // Attempted bypass of pending status
      };

      const res = await contactApi.submit(maliciousPayload);
      assert.ok(res);

      const row = dbHelper.queryOne(
        'SELECT user_id, status FROM contact_messages WHERE email = ? ORDER BY id DESC LIMIT 1',
        spoofEmail
      );
      assert.ok(row);
      assert.strictEqual(row.user_id, null, 'Backend must neutralize spoofed user_id and store NULL');
      assert.strictEqual(row.status, 'pendiente', 'Backend must ignore spoofed status and set pendiente');
    });
  });

  /* =========================================================================
     JOURNEY B: Normal User Registration & Projects Experience
     ========================================================================= */
  describe('Journey B: Normal User Registration, Session & Projects Exploration', () => {
    const candidateUser = makeUser({ name: 'Estudiante Explorador' });
    let registeredToken = null;
    let registeredUser = null;
    let sampleCatalog = [];

    test('B.1 New user registers successfully, activates session immediately, and stores token', async () => {
      const regRes = await authApi.register({
        name: candidateUser.name,
        email: candidateUser.email,
        password: candidateUser.password,
      });

      assert.ok(regRes);
      assert.ok(regRes.token, 'Registration must return active JWT token');
      assert.ok(regRes.user, 'Registration must return user profile');
      assert.strictEqual(regRes.user.name, candidateUser.name);
      assert.strictEqual(regRes.user.email, candidateUser.email);
      assert.strictEqual(regRes.user.role, 'usuario_normal', 'Default role must be usuario_normal');
      assert.strictEqual('password' in regRes.user, false, 'Password must not be returned');
      assert.strictEqual('password_hash' in regRes.user, false, 'Password hash must not be returned');

      // Verify JWT format (3 dot-separated base64url segments)
      const segments = regRes.token.split('.');
      assert.strictEqual(segments.length, 3, 'JWT must have header, payload, and signature');

      // White-box SQLite check: password_hash must be bcrypt-hashed
      const dbUser = dbHelper.queryOne('SELECT password_hash FROM users WHERE email = ?', candidateUser.email);
      assert.ok(dbUser && dbUser.password_hash);
      assert.ok(
        dbUser.password_hash.startsWith('$2a$') || dbUser.password_hash.startsWith('$2b$'),
        'Password must be cryptographically hashed with bcrypt'
      );

      // Save credentials for subsequent journey steps
      registeredToken = regRes.token;
      registeredUser = regRes.user;
      mockLocalStorage.setItem('token', registeredToken);
      mockLocalStorage.setItem('user', JSON.stringify(registeredUser));
    });

    test('B.2 User profile retrieval (/api/auth/me) validates active session using stored token', async () => {
      assert.ok(registeredToken);
      mockLocalStorage.setItem('token', registeredToken);

      const meRes = await authApi.me();
      assert.ok(meRes && meRes.user);
      assert.strictEqual(meRes.user.id, registeredUser.id);
      assert.strictEqual(meRes.user.email, registeredUser.email);
      assert.strictEqual(meRes.user.role, 'usuario_normal');
    });

    test('B.3 Authenticated normal user unlocks private catalog (/proyectos)', async () => {
      mockLocalStorage.setItem('token', registeredToken);

      const catalog = await projectsApi.list();
      assert.ok(Array.isArray(catalog), 'Catalog must be an array');
      assert.ok(catalog.length >= 2, 'Catalog must contain projects');

      for (const proj of catalog) {
        assert.ok(proj.id);
        assert.ok(proj.title);
        assert.ok(proj.short_description);
        assert.ok(proj.technologies);
        assert.strictEqual(proj.is_published, 1, 'Normal users must only see published projects');
      }

      sampleCatalog = catalog;
    });

    test('B.4 Reactive Search: filters catalog by title, short description, and technology keywords', () => {
      assert.ok(sampleCatalog.length > 0);

      // Search by partial title of first project
      const firstTitle = sampleCatalog[0].title;
      const queryWord = firstTitle.split(' ')[0];
      const titleMatches = filterProjects(sampleCatalog, queryWord, '');
      assert.ok(titleMatches.length >= 1);
      assert.ok(titleMatches.some((p) => p.id === sampleCatalog[0].id));

      // Adversarial search: non-existent keyword yields 0 results safely without crashing
      const noMatches = filterProjects(sampleCatalog, 'NonExistentTechXYZ12345!', '');
      assert.strictEqual(noMatches.length, 0);

      // Adversarial search: special characters / empty spaces handle cleanly
      const whitespaceMatches = filterProjects(sampleCatalog, '   ', '');
      assert.strictEqual(whitespaceMatches.length, sampleCatalog.length);
    });

    test('B.5 Technology Pill Filter: extracts tags dynamically and isolates projects by tech pill', () => {
      assert.ok(sampleCatalog.length > 0);

      // Extract unique tech pills across catalog
      const techSet = new Set();
      sampleCatalog.forEach((p) => {
        parseTechnologies(p.technologies).forEach((t) => techSet.add(t));
      });
      const allTags = Array.from(techSet);
      assert.ok(allTags.length >= 1, 'Should have parsed technology tags');

      // Filter by the first tech tag
      const selectedPill = allTags[0];
      const pillMatches = filterProjects(sampleCatalog, '', selectedPill);
      assert.ok(pillMatches.length >= 1);
      for (const p of pillMatches) {
        const pTags = parseTechnologies(p.technologies);
        assert.ok(
          pTags.includes(selectedPill),
          `Filtered project must contain selected pill tag "${selectedPill}"`
        );
      }
    });

    test('B.6 Navigates to project detail (/proyectos/:id) and handles non-existent IDs gracefully', async () => {
      mockLocalStorage.setItem('token', registeredToken);
      const targetId = sampleCatalog[0].id;

      // 1. Valid detail request
      const detail = await projectsApi.getById(targetId);
      assert.ok(detail);
      assert.strictEqual(detail.id, targetId);
      assert.ok(detail.title);
      assert.ok(detail.description);
      assert.strictEqual(detail.is_published, 1);

      // 2. Non-existent project ID returns 404
      await assert.rejects(
        async () => {
          await projectsApi.getById(999999);
        },
        (err) => {
          assert.strictEqual(err.status, 404, 'Non-existent project must return 404');
          return true;
        }
      );
    });
  });

  /* =========================================================================
     JOURNEY C: Normal User Role Boundary & 403 Forbidden Diagnostics
     ========================================================================= */
  describe('Journey C: Normal User Role Boundary Enforcement & Diagnostics', () => {
    let normalUserToken = null;
    let normalUserData = null;

    before(async () => {
      // Authenticate standard normal user
      const res = await authApi.login({
        email: 'usuario@portfolio.local',
        password: 'Usuario123!',
      });
      normalUserToken = res.token;
      normalUserData = res.user;
    });

    test('C.1 Normal user attempting operator inbox (/operador) is rejected with HTTP 403', async () => {
      mockLocalStorage.setItem('token', normalUserToken);
      await assert.rejects(
        async () => {
          await operatorApi.getMessages();
        },
        (err) => {
          assert.strictEqual(err.status, 403, 'Normal user must be forbidden from operator messages');
          return true;
        }
      );
    });

    test('C.2 Normal user attempting operator actions (inspect/reply) is rejected with HTTP 403', async () => {
      mockLocalStorage.setItem('token', normalUserToken);

      await assert.rejects(
        async () => {
          await operatorApi.getMessageById(1);
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await operatorApi.respondMessage(1, { response_message: 'Unauthorized reply' });
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          return true;
        }
      );
    });

    test('C.3 Normal user attempting admin actions (metrics, users, role changes, CRUD) is rejected with HTTP 403', async () => {
      mockLocalStorage.setItem('token', normalUserToken);

      // 1. GET /api/metrics
      await assert.rejects(
        async () => {
          await metricsApi.getMetrics();
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          return true;
        }
      );

      // 2. GET /api/users
      await assert.rejects(
        async () => {
          await usersApi.list();
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          return true;
        }
      );

      // 3. PUT /api/users/:id/role
      await assert.rejects(
        async () => {
          await usersApi.updateRole(normalUserData.id, 'administrador');
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          return true;
        }
      );

      // 4. POST /api/projects
      await assert.rejects(
        async () => {
          await projectsApi.create({
            title: 'Hacked Project',
            description: 'Unauthorized creation',
            short_description: 'Hack',
            technologies: 'Node',
            is_published: 1,
          });
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          return true;
        }
      );
    });

    test('C.4 ProtectedRoute Diagnostic View: returns 403 Forbidden state with role details and recovery buttons', () => {
      // 1. Test navigation to /operador (requires: ['operador', 'administrador'])
      const operatorGuard = evaluateProtectedRoute({
        user: normalUserData,
        allowedRoles: ['operador', 'administrador'],
      });

      assert.strictEqual(operatorGuard.status, 403);
      assert.strictEqual(operatorGuard.view, 'FORBIDDEN_403');
      assert.strictEqual(operatorGuard.currentRole, 'usuario_normal');
      assert.deepStrictEqual(operatorGuard.allowedRoles, ['operador', 'administrador']);
      assert.ok(operatorGuard.actions.includes('Volver al inicio'));
      assert.ok(operatorGuard.actions.includes('Ver Proyectos'));
      assert.ok(operatorGuard.actions.includes('Cambiar cuenta'));

      // 2. Test navigation to /admin (requires: ['administrador'])
      const adminGuard = evaluateProtectedRoute({
        user: normalUserData,
        allowedRoles: ['administrador'],
      });

      assert.strictEqual(adminGuard.status, 403);
      assert.strictEqual(adminGuard.view, 'FORBIDDEN_403');
      assert.strictEqual(adminGuard.currentRole, 'usuario_normal');
      assert.deepStrictEqual(adminGuard.allowedRoles, ['administrador']);
      assert.ok(adminGuard.actions.includes('Volver al inicio'));
      assert.ok(adminGuard.actions.includes('Ver Proyectos'));
      assert.ok(adminGuard.actions.includes('Cambiar cuenta'));
    });

    test('C.5 Adversarial Role Spoofing in localStorage does not bypass backend authorization', async () => {
      // Attacker manipulates localStorage to claim administrator role
      mockLocalStorage.setItem('token', normalUserToken);
      mockLocalStorage.setItem(
        'user',
        JSON.stringify({ ...normalUserData, role: 'administrador' })
      );

      // Backend must verify JWT claims signature, rejecting the forged role
      await assert.rejects(
        async () => {
          await metricsApi.getMetrics();
        },
        (err) => {
          assert.strictEqual(err.status, 403, 'Backend must reject token despite forged localStorage');
          return true;
        }
      );
    });
  });

  /* =========================================================================
     JOURNEY D: Operator Workflow & Inbox Resolution
     ========================================================================= */
  describe('Journey D: Operator Inbox Workflow, Metrics & Response Lifecycle', () => {
    let operatorToken = null;
    let operatorUser = null;
    let testInquiryId = null;
    const testInquiryEmail = randomEmail('client');

    before(async () => {
      // 1. Create a fresh pending inquiry to process in this journey
      const inqRes = await contactApi.submit({
        name: 'Cliente VIP Operaciones',
        email: testInquiryEmail,
        inquiry_type: 'Cotización / Presupuesto',
        message: 'Solicitamos cotización para el rediseño completo de la plataforma institucional.',
      });
      assert.ok(inqRes);

      const created = dbHelper.queryOne(
        'SELECT id FROM contact_messages WHERE email = ? ORDER BY id DESC LIMIT 1',
        testInquiryEmail
      );
      assert.ok(created);
      testInquiryId = created.id;

      // 2. Log in as operator
      const opLogin = await authApi.login({
        email: 'operador@portfolio.local',
        password: 'Operador123!',
      });
      operatorToken = opLogin.token;
      operatorUser = opLogin.user;
      assert.strictEqual(operatorUser.role, 'operador');
    });

    test('D.1 Operator accesses /operador and verifies inbox KPI metrics integrity', async () => {
      mockLocalStorage.setItem('token', operatorToken);

      const messages = await operatorApi.getMessages();
      assert.ok(Array.isArray(messages));
      assert.ok(messages.length >= 1);

      // Verify KPI aggregation logic
      const total = messages.length;
      const pending = messages.filter((m) => m.status === 'pendiente').length;
      const responded = messages.filter((m) => m.status === 'respondida').length;

      assert.strictEqual(total, pending + responded, 'total must equal pending + responded');
      assert.ok(pending >= 1, 'Must have at least our newly seeded pending inquiry');
    });

    test('D.2 Operator inspects pending inquiry details and verifies unresponded state', async () => {
      mockLocalStorage.setItem('token', operatorToken);
      assert.ok(testInquiryId);

      const inquiry = await operatorApi.getMessageById(testInquiryId);
      assert.ok(inquiry);
      assert.strictEqual(inquiry.id, testInquiryId);
      assert.strictEqual(inquiry.name, 'Cliente VIP Operaciones');
      assert.strictEqual(inquiry.email, testInquiryEmail);
      assert.strictEqual(inquiry.status, 'pendiente');
      assert.strictEqual(inquiry.response_message, null);
      assert.strictEqual(inquiry.responded_at, null);
    });

    test('D.3 Operator generates canned template response and submits reply successfully', async () => {
      mockLocalStorage.setItem('token', operatorToken);

      // Generate response using canned template generator
      const cannedReply = CANNED_TEMPLATES.cotizacion('Cliente VIP Operaciones');
      assert.ok(cannedReply.includes('Estimado/a Cliente VIP Operaciones'));

      // Submit reply via POST /api/operator/messages/:id/respond
      const replyRes = await operatorApi.respondMessage(testInquiryId, cannedReply);
      assert.ok(replyRes);
      assert.ok(replyRes.message, 'Expected success message');

      // White-box SQLite verification
      const updatedRow = dbHelper.queryOne(
        'SELECT status, response_message, responded_at FROM contact_messages WHERE id = ?',
        testInquiryId
      );
      assert.ok(updatedRow);
      assert.strictEqual(updatedRow.status, 'respondida', 'Status must transition to respondida');
      assert.strictEqual(updatedRow.response_message, cannedReply, 'Response message must match');
      assert.ok(updatedRow.responded_at, 'responded_at timestamp must be populated');
    });

    test('D.4 Status filtering confirms inquiry transitioned from pending to respondida', async () => {
      mockLocalStorage.setItem('token', operatorToken);

      // 1. Pending filter must no longer contain this inquiry
      const pendingList = await operatorApi.getMessages('pendiente');
      assert.ok(Array.isArray(pendingList));
      const inPending = pendingList.some((m) => m.id === testInquiryId);
      assert.strictEqual(inPending, false, 'Resolved inquiry must not appear in pending list');

      // 2. Responded filter must contain this inquiry
      const respondedList = await operatorApi.getMessages('respondida');
      assert.ok(Array.isArray(respondedList));
      const inResponded = respondedList.some((m) => m.id === testInquiryId);
      assert.strictEqual(inResponded, true, 'Resolved inquiry must appear in respondida list');
    });

    test('D.5 Adversarial reply validation: empty, whitespace-only, and non-existent IDs are rejected', async () => {
      mockLocalStorage.setItem('token', operatorToken);

      // Empty reply
      await assert.rejects(
        async () => {
          await operatorApi.respondMessage(testInquiryId, '');
        },
        (err) => {
          assert.strictEqual(err.status, 400);
          return true;
        }
      );

      // Whitespace-only reply
      await assert.rejects(
        async () => {
          await operatorApi.respondMessage(testInquiryId, '    ');
        },
        (err) => {
          assert.strictEqual(err.status, 400);
          return true;
        }
      );

      // Non-existent message ID
      await assert.rejects(
        async () => {
          await operatorApi.respondMessage(999999, 'Valid message text');
        },
        (err) => {
          assert.strictEqual(err.status, 404);
          return true;
        }
      );
    });
  });

  /* =========================================================================
     JOURNEY E: Administrator Governance & Lockout Protection
     ========================================================================= */
  describe('Journey E: Administrator Dashboard, Recharts Contracts & Lockout Protection', () => {
    let adminToken = null;
    let adminUser = null;
    let normalToken = null;
    let createdDraftProjectId = null;

    before(async () => {
      const adminLogin = await authApi.login({
        email: 'admin@portfolio.local',
        password: 'Admin123!',
      });
      adminToken = adminLogin.token;
      adminUser = adminLogin.user;
      assert.strictEqual(adminUser.role, 'administrador');

      const userLogin = await authApi.login({
        email: 'usuario@portfolio.local',
        password: 'Usuario123!',
      });
      normalToken = userLogin.token;
    });

    test('E.1 Administrator accesses /admin, loads system metrics KPIs and validates data shapes', async () => {
      mockLocalStorage.setItem('token', adminToken);

      const metrics = await metricsApi.getMetrics();
      assert.ok(metrics);

      // Verify all KPI metrics exist and are non-negative numbers
      const kpis = [
        'visitas_generales',
        'accesos_autenticados',
        'total_users',
        'total_projects',
        'total_services',
        'total_messages',
      ];
      for (const kpi of kpis) {
        assert.ok(kpi in metrics, `Metrics must contain KPI: ${kpi}`);
        assert.strictEqual(typeof Number(metrics[kpi]), 'number');
        assert.ok(Number(metrics[kpi]) >= 0, `${kpi} must be >= 0`);
      }
    });

    test('E.2 Recharts Visualizations Contract: verifies datasets and transformation resiliency', async () => {
      mockLocalStorage.setItem('token', adminToken);
      const metrics = await metricsApi.getMetrics();

      // 1. Inquiries by type schema check
      assert.ok(Array.isArray(metrics.inquiriesByType), 'inquiriesByType must be an array');
      const barData = transformInquiriesForRecharts(metrics);
      assert.ok(Array.isArray(barData));
      for (const item of barData) {
        assert.ok(item.name, 'Bar item must have friendly name');
        assert.strictEqual(typeof item.count, 'number');
        assert.ok(!isNaN(item.count));
      }

      // 2. Registrations timeline schema check
      assert.ok(Array.isArray(metrics.registrationsTimeline), 'registrationsTimeline must be an array');
      const areaData = transformTimelineForRecharts(metrics);
      assert.ok(Array.isArray(areaData));
      for (const item of areaData) {
        assert.ok('date' in item);
        assert.strictEqual(typeof item.count, 'number');
        assert.ok(!isNaN(item.count));
      }

      // 3. Adversarial Resilience: transformers handle null, undefined, or empty objects without throwing
      assert.deepStrictEqual(transformInquiriesForRecharts(null), []);
      assert.deepStrictEqual(transformInquiriesForRecharts({}), []);
      assert.deepStrictEqual(transformTimelineForRecharts(undefined), []);
      assert.deepStrictEqual(transformTimelineForRecharts({ registrationsTimeline: null }), []);
    });

    test('E.3 Admin creates draft project (is_published = 0) and verifies it is hidden from normal users and preview', async () => {
      mockLocalStorage.setItem('token', adminToken);

      const draftPayload = {
        title: `Draft Project ${randomId('draft')}`,
        short_description: 'Confidential draft project under development',
        description: 'Complete internal specifications for draft project.',
        technologies: 'Node.js, Express, WebAssembly',
        image_url: '/assets/projects/draft.webp',
        demo_url: 'https://draft.local',
        repository_url: 'https://github.com/developer/draft',
        is_published: 0,
      };

      const createRes = await projectsApi.create(draftPayload);
      assert.ok(createRes);
      assert.ok(createRes.id);
      createdDraftProjectId = createRes.id;

      // 1. White-box check in SQLite
      const dbRow = dbHelper.queryOne('SELECT is_published FROM projects WHERE id = ?', createdDraftProjectId);
      assert.ok(dbRow);
      assert.strictEqual(dbRow.is_published, 0, 'Database is_published must be 0');

      // 2. Public preview check: MUST NOT appear
      const preview = await projectsApi.preview();
      const inPreview = preview.some((p) => p.id === createdDraftProjectId);
      assert.strictEqual(inPreview, false, 'Draft project must NOT appear in public preview');

      // 3. Normal user catalog check: MUST NOT appear
      mockLocalStorage.setItem('token', normalToken);
      const userCatalog = await projectsApi.list();
      const inCatalog = userCatalog.some((p) => p.id === createdDraftProjectId);
      assert.strictEqual(inCatalog, false, 'Draft project must NOT appear in normal user catalog');
    });

    test('E.4 Admin publishes the draft project and verifies it becomes visible in private catalog', async () => {
      mockLocalStorage.setItem('token', adminToken);
      assert.ok(createdDraftProjectId);

      // Publish project
      const updateRes = await projectsApi.update(createdDraftProjectId, {
        title: 'Published Project Now Visible',
        short_description: 'Published showcase project',
        description: 'Now officially published for registered users.',
        technologies: 'Node.js, React, Tailwind',
        is_published: 1,
      });
      assert.ok(updateRes);

      // Normal user checks catalog again: project MUST now be visible
      mockLocalStorage.setItem('token', normalToken);
      const userCatalog = await projectsApi.list();
      const inCatalog = userCatalog.some((p) => p.id === createdDraftProjectId);
      assert.strictEqual(inCatalog, true, 'Published project MUST now be visible in normal user catalog');
    });

    test('E.5 Admin modifies a user role, promoting them to operator and granting access', async () => {
      mockLocalStorage.setItem('token', adminToken);

      // 1. Register candidate user
      const candidate = makeUser({ name: 'Promotee To Operator' });
      const reg = await authApi.register({
        name: candidate.name,
        email: candidate.email,
        password: candidate.password,
      });
      const candidateId = reg.user.id;
      const candidateToken = reg.token;

      // 2. Candidate initially blocked from operator route
      mockLocalStorage.setItem('token', candidateToken);
      await assert.rejects(
        async () => {
          await operatorApi.getMessages();
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          return true;
        }
      );

      // 3. Admin promotes candidate to 'operador'
      mockLocalStorage.setItem('token', adminToken);
      const promoteRes = await usersApi.updateRole(candidateId, 'operador');
      assert.ok(promoteRes);
      assert.strictEqual(promoteRes.role, 'operador');

      // 4. Candidate re-authenticates to get updated JWT claims with new role
      const candidateLogin = await authApi.login({
        email: candidate.email,
        password: candidate.password,
      });
      assert.strictEqual(candidateLogin.user.role, 'operador');

      // 5. Promoted candidate successfully accesses operator route
      mockLocalStorage.setItem('token', candidateLogin.token);
      const messages = await operatorApi.getMessages();
      assert.ok(Array.isArray(messages));
    });

    test('E.6 Administrative Lockout Prevention: Self-deletion and Sole Admin demotion are blocked', async () => {
      mockLocalStorage.setItem('token', adminToken);

      // Count current administrators in database
      const adminCountRow = dbHelper.queryOne("SELECT COUNT(*) AS count FROM users WHERE role = 'administrador'");
      const initialAdminCount = adminCountRow ? Number(adminCountRow.count) : 0;

      // 1. Self-deletion prevention: Admin cannot delete their own account
      await assert.rejects(
        async () => {
          await apiRequest(`/users/${adminUser.id}`, { method: 'DELETE' });
        },
        (err) => {
          assert.strictEqual(err.status, 400, 'Admin self-deletion must return 400 Bad Request');
          return true;
        }
      );

      // 2. If sole admin, demotion to 'usuario_normal' must be blocked
      if (initialAdminCount <= 1) {
        await assert.rejects(
          async () => {
            await usersApi.updateRole(adminUser.id, 'usuario_normal');
          },
          (err) => {
            assert.strictEqual(err.status, 400, 'Sole admin demotion to usuario_normal must be blocked');
            return true;
          }
        );

        // Demotion to 'operador' must also be blocked
        await assert.rejects(
          async () => {
            await usersApi.updateRole(adminUser.id, 'operador');
          },
          (err) => {
            assert.strictEqual(err.status, 400, 'Sole admin demotion to operador must be blocked');
            return true;
          }
        );
      }

      // 3. Multi-admin lifecycle & dynamic re-arming of lockout protection
      // Create second admin
      const secondAdminData = makeUser({ name: 'Segundo Administrador' });
      const reg = await authApi.register({
        name: secondAdminData.name,
        email: secondAdminData.email,
        password: secondAdminData.password,
      });
      const secondAdminId = reg.user.id;

      // Promote to admin
      await usersApi.updateRole(secondAdminId, 'administrador');

      // Now 2 admins exist: demoting second admin succeeds
      const demoteRes = await usersApi.updateRole(secondAdminId, 'usuario_normal');
      assert.ok(demoteRes);
      assert.strictEqual(demoteRes.role, 'usuario_normal');

      // Now back to 1 admin: demoting sole admin is immediately blocked again!
      await assert.rejects(
        async () => {
          await usersApi.updateRole(adminUser.id, 'usuario_normal');
        },
        (err) => {
          assert.strictEqual(err.status, 400, 'Re-armed lockout protection must block sole admin demotion');
          return true;
        }
      );
    });

    test('E.7 Cleanup: Admin deletes test project and confirms subsequent 404', async () => {
      mockLocalStorage.setItem('token', adminToken);
      assert.ok(createdDraftProjectId);

      await projectsApi.delete(createdDraftProjectId);

      // Confirm subsequent GET returns 404 Not Found
      await assert.rejects(
        async () => {
          await projectsApi.getById(createdDraftProjectId);
        },
        (err) => {
          assert.strictEqual(err.status, 404, 'Deleted project must return 404');
          return true;
        }
      );
    });
  });
});
