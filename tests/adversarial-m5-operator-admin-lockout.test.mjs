/**
 * Adversarial Test Suite for Milestone 5 (Operator & Admin Workflows, Recharts & Lockout Protection)
 * Focus:
 * 1. Operator workflow: Inquiry status filtering, response modal payload validation, and optimistic state updates.
 * 2. Admin Dashboard metrics & Recharts contracts: /api/metrics data shapes (inquiriesByType, registrationsTimeline),
 *    formatting transformers, and undefined/empty resilience.
 * 3. Administrative Lockout Prevention: Self-deletion prevention, last admin demotion prevention,
 *    last admin deletion prevention, multi-admin lifecycle re-arming, and UI client-side defense.
 * 
 * Native Node.js test runner (node:test, node:assert/strict).
 */
import test, { describe, beforeEach, after, before } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Import frontend API client
import {
  apiRequest,
  authApi,
  servicesApi,
  projectsApi,
  contactApi,
  metricsApi,
  operatorApi,
  usersApi
} from '../frontend/src/services/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory mock localStorage for Node.js environment
class MockLocalStorage {
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

// Mirror OperatorDashboard Canned Templates
const QUICK_TEMPLATES = [
  {
    title: 'Agradecimiento General',
    text: (name) =>
      `Estimado/a ${name},\n\nMuchas gracias por contactarte con nosotros. Hemos recibido tu consulta y nuestro equipo la está revisando con atención. Te responderemos a la brevedad con la información solicitada.\n\nSaludos cordiales,\nEquipo de Operaciones`,
  },
  {
    title: 'Cotización / Presupuesto',
    text: (name) =>
      `Estimado/a ${name},\n\nGracias por tu interés en nuestros servicios. Con respecto a tu solicitud de cotización, hemos preparado una estimación preliminar y nos encantaría coordinar una breve llamada para definir los requerimientos técnicos y plazos.\n\nQuedamos a tu entera disposición.\nSaludos cordiales,`,
  },
  {
    title: 'Solicitud de Más Información',
    text: (name) =>
      `Estimado/a ${name},\n\nHemos evaluado tu consulta técnica. Para poder brindarte una solución precisa y ajustada a tus necesidades, ¿serías tan amable de detallarnos un poco más los requerimientos y el alcance previsto para este proyecto?\n\nDesde ya, muchas gracias por tu tiempo y colaboración.`,
  },
];

// Mirror OperatorDashboard Search Filter Logic
function filterOperatorInquiries(inquiries, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return inquiries;
  const q = searchTerm.toLowerCase().trim();
  return inquiries.filter((inquiry) => {
    const nameMatch = inquiry.name?.toLowerCase().includes(q);
    const emailMatch = inquiry.email?.toLowerCase().includes(q);
    const typeMatch = inquiry.inquiry_type?.toLowerCase().includes(q);
    const messageMatch = inquiry.message?.toLowerCase().includes(q);
    const replyMatch = inquiry.response_message?.toLowerCase().includes(q);
    const idMatch = String(inquiry.id).includes(q);
    return Boolean(nameMatch || emailMatch || typeMatch || messageMatch || replyMatch || idMatch);
  });
}

// Mirror AdminDashboard Recharts Data Prep Logic
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
    date: item.date ? item.date.slice(5) : '', // 'MM-DD'
    fullDate: item.date,
    count: Number(item.count) || 0,
  }));
}

// Mirror AdminDashboard Client-Side Lockout Checks
function validateClientSideUserDeletion({ authUser, userToDelete, totalAdmins }) {
  if (authUser && userToDelete.id === authUser.id) {
    return { allowed: false, error: 'No puedes eliminar tu propia cuenta en sesión activa.' };
  }
  if (userToDelete.role === 'administrador' && totalAdmins <= 1) {
    return {
      allowed: false,
      error: 'Operación no permitida: No se puede eliminar al único administrador del sistema.',
    };
  }
  return { allowed: true, error: null };
}

function validateClientSideRoleUpdate({ userToUpdateRole, selectedRole, totalAdmins }) {
  if (
    userToUpdateRole.role === 'administrador' &&
    selectedRole !== 'administrador' &&
    totalAdmins <= 1
  ) {
    return {
      allowed: false,
      error:
        'Operación denegada: No es posible cambiar el rol del único administrador del sistema para prevenir el bloqueo administrativo.',
    };
  }
  return { allowed: true, error: null };
}

describe('Milestone 5 Adversarial Challenges: Operator & Admin Dashboards, Recharts & Lockout Protection', () => {
  let mockStorage;
  let originalFetch;
  let serverProcess = null;
  const BACKEND_BASE = 'http://localhost:5000';

  let adminToken = null;
  let adminUser = null;
  let operatorToken = null;
  let operatorUser = null;
  let normalToken = null;
  let normalUser = null;

  before(async () => {
    mockStorage = new MockLocalStorage();
    globalThis.localStorage = mockStorage;
    originalFetch = globalThis.fetch;

    // Direct fetch to backend base URL
    globalThis.fetch = async (url, config = {}) => {
      const fullUrl = url.startsWith('http') ? url : `${BACKEND_BASE}${url}`;
      return originalFetch(fullUrl, config);
    };

    // Check if backend is alive, otherwise spawn
    let serverRunning = false;
    try {
      const res = await originalFetch('http://localhost:5000/api/health');
      if (res.status === 200) serverRunning = true;
    } catch {}

    if (!serverRunning) {
      const entrypoint = path.resolve(__dirname, '../backend/src/server.js');
      const backendCwd = path.resolve(__dirname, '../backend');
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
    }

    // Authenticate personas
    const adminRes = await authApi.login({
      email: 'admin@portfolio.local',
      password: 'Admin123!',
    });
    adminToken = adminRes.token;
    adminUser = adminRes.user;

    const opRes = await authApi.login({
      email: 'operador@portfolio.local',
      password: 'Operador123!',
    });
    operatorToken = opRes.token;
    operatorUser = opRes.user;

    const userRes = await authApi.login({
      email: 'usuario@portfolio.local',
      password: 'Usuario123!',
    });
    normalToken = userRes.token;
    normalUser = userRes.user;
  });

  after(() => {
    globalThis.fetch = originalFetch;
    delete globalThis.localStorage;
    if (serverProcess) {
      try {
        serverProcess.kill('SIGTERM');
      } catch {}
      serverProcess = null;
    }
  });

  beforeEach(() => {
    mockStorage.clear();
  });

  /* =========================================================================
     SUITE 1: Operator Workflow & Inbox Management
     ========================================================================= */
  describe('Suite 1: Operator Workflow, Inquiry Filtering & Optimistic Response Lifecycle', () => {
    let createdInquiryId = null;

    test('1.1 Unauthenticated requests to /api/operator/messages return 401 Unauthorized', async () => {
      mockStorage.removeItem('token');
      await assert.rejects(
        async () => {
          await operatorApi.getMessages();
        },
        (err) => {
          assert.strictEqual(err.status, 401);
          return true;
        }
      );
    });

    test('1.2 Normal user (usuario_normal) accessing operator inbox returns 403 Forbidden', async () => {
      mockStorage.setItem('token', normalToken);
      await assert.rejects(
        async () => {
          await operatorApi.getMessages();
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          return true;
        }
      );
    });

    test('1.3 Operator token successfully retrieves all inquiries with getMessages()', async () => {
      mockStorage.setItem('token', operatorToken);
      const messages = await operatorApi.getMessages();
      assert.ok(Array.isArray(messages), 'Expected messages to be an Array');
      assert.ok(messages.length >= 0, 'Expected non-negative messages count');
    });

    test('1.4 Seed or submit a fresh pending inquiry for workflow testing', async () => {
      // Submit public inquiry
      mockStorage.removeItem('token');
      const submitRes = await contactApi.submit({
        name: 'Operador Challenge Inquirer',
        email: 'inquirer_m5@test.local',
        inquiry_type: 'Presupuesto y Cotización',
        message: 'Solicitud para evaluación de flujo operativo de respuestas del panel.',
      });
      assert.strictEqual(submitRes.success, true);
      assert.strictEqual(submitRes.status, 'pendiente');
      assert.ok(submitRes.id);
      createdInquiryId = submitRes.id;
    });

    test('1.5 Status filtering: getMessages("pendiente") includes only status="pendiente"', async () => {
      mockStorage.setItem('token', operatorToken);
      const pendingMessages = await operatorApi.getMessages('pendiente');
      assert.ok(Array.isArray(pendingMessages));
      assert.ok(pendingMessages.length > 0, 'Should have at least 1 pending message');
      for (const msg of pendingMessages) {
        assert.strictEqual(msg.status, 'pendiente');
      }
      const found = pendingMessages.some((m) => m.id === createdInquiryId);
      assert.ok(found, `Newly created inquiry ${createdInquiryId} must appear in pending list`);
    });

    test('1.6 Status filtering: getMessages("respondida") includes only status="respondida"', async () => {
      mockStorage.setItem('token', operatorToken);
      const respondedMessages = await operatorApi.getMessages('respondida');
      assert.ok(Array.isArray(respondedMessages));
      for (const msg of respondedMessages) {
        assert.strictEqual(msg.status, 'respondida');
      }
      const foundCreated = respondedMessages.some((m) => m.id === createdInquiryId);
      assert.strictEqual(foundCreated, false, 'Pending inquiry must NOT appear in respondida list');
    });

    test('1.7 Status filtering: unknown status query does not crash and returns unfiltered messages', async () => {
      mockStorage.setItem('token', operatorToken);
      const allMessages = await operatorApi.getMessages();
      const unknownFilterMessages = await operatorApi.getMessages('estado_inexistente_xyz');
      assert.ok(Array.isArray(unknownFilterMessages));
      assert.strictEqual(unknownFilterMessages.length, allMessages.length);
    });

    test('1.8 Inquiry detail inspection: getMessageById(id) returns complete entity', async () => {
      mockStorage.setItem('token', operatorToken);
      const msg = await operatorApi.getMessageById(createdInquiryId);
      assert.strictEqual(msg.id, createdInquiryId);
      assert.strictEqual(msg.name, 'Operador Challenge Inquirer');
      assert.strictEqual(msg.email, 'inquirer_m5@test.local');
      assert.strictEqual(msg.status, 'pendiente');
      assert.ok(msg.created_at);
      assert.strictEqual(msg.response_message, null);
      assert.strictEqual(msg.responded_at, null);
    });

    test('1.9 Inquiry detail inspection: non-existent ID (999999) returns 404 Not Found', async () => {
      mockStorage.setItem('token', operatorToken);
      await assert.rejects(
        async () => {
          await operatorApi.getMessageById(999999);
        },
        (err) => {
          assert.strictEqual(err.status, 404);
          return true;
        }
      );
    });

    test('1.10 Reply modal validation: empty reply rejected with 400 Bad Request', async () => {
      mockStorage.setItem('token', operatorToken);
      await assert.rejects(
        async () => {
          await operatorApi.respondMessage(createdInquiryId, '');
        },
        (err) => {
          assert.strictEqual(err.status, 400);
          assert.ok(err.message.includes('obligatorio'));
          return true;
        }
      );
    });

    test('1.11 Reply modal validation: whitespace-only reply rejected with 400 Bad Request', async () => {
      mockStorage.setItem('token', operatorToken);
      await assert.rejects(
        async () => {
          await operatorApi.respondMessage(createdInquiryId, '    \n  \t   ');
        },
        (err) => {
          assert.strictEqual(err.status, 400);
          return true;
        }
      );
    });

    test('1.12 Reply modal validation: replying to non-existent ID returns 404 Not Found', async () => {
      mockStorage.setItem('token', operatorToken);
      await assert.rejects(
        async () => {
          await operatorApi.respondMessage(999999, 'Respuesta a mensaje que no existe.');
        },
        (err) => {
          assert.strictEqual(err.status, 404);
          return true;
        }
      );
    });

    test('1.13 Canned template generators produce personalized greeting and professional text', () => {
      for (const tmpl of QUICK_TEMPLATES) {
        assert.ok(tmpl.title);
        assert.strictEqual(typeof tmpl.text, 'function');
        const generated = tmpl.text('Carlos');
        assert.ok(generated.includes('Carlos'));
        assert.ok(generated.length > 50);
      }
    });

    test('1.14 Valid reply submission: transitions status to "respondida" and sets timestamp', async () => {
      mockStorage.setItem('token', operatorToken);
      const replyContent = QUICK_TEMPLATES[0].text('Operador Challenge Inquirer');
      const res = await operatorApi.respondMessage(createdInquiryId, replyContent);

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.status, 'respondida');
      assert.strictEqual(res.response_message, replyContent);
      assert.ok(res.responded_at);

      // Verify persistence via GET
      const verified = await operatorApi.getMessageById(createdInquiryId);
      assert.strictEqual(verified.status, 'respondida');
      assert.strictEqual(verified.response_message, replyContent);
      assert.ok(verified.responded_at);
    });

    test('1.15 Optimistic state update simulation mirrors frontend component logic', () => {
      // Simulate frontend state before reply
      const initialInquiries = [
        { id: createdInquiryId, status: 'pendiente', response_message: null },
        { id: 999, status: 'pendiente', response_message: null },
      ];
      const initialMetrics = { total: 2, pending: 2, responded: 0 };

      // Dispatch optimistic transition
      const replyPayload = {
        status: 'respondida',
        response_message: 'Mensaje respondido con éxito.',
        responded_at: new Date().toISOString(),
      };

      const updatedInquiries = initialInquiries.map((msg) =>
        msg.id === createdInquiryId ? { ...msg, ...replyPayload } : msg
      );
      const updatedMetrics = {
        ...initialMetrics,
        pending: Math.max(0, initialMetrics.pending - 1),
        responded: initialMetrics.responded + 1,
      };

      assert.strictEqual(updatedInquiries.find((m) => m.id === createdInquiryId).status, 'respondida');
      assert.strictEqual(updatedInquiries.find((m) => m.id === 999).status, 'pendiente');
      assert.strictEqual(updatedMetrics.pending, 1);
      assert.strictEqual(updatedMetrics.responded, 1);
    });

    test('1.16 Client search filter matches accurately across name, email, type, message, reply, and id', () => {
      const mockList = [
        {
          id: 101,
          name: 'Ana María Gómez',
          email: 'ana@gmail.com',
          inquiry_type: 'Presupuesto',
          message: 'Necesito una tienda en línea',
          response_message: null,
        },
        {
          id: 102,
          name: 'Roberto Carlos',
          email: 'roberto@empresa.com',
          inquiry_type: 'Oferta Laboral',
          message: 'Buscamos desarrollador senior',
          response_message: 'Gracias por la oferta, agendemos entrevista',
        },
      ];

      // Match by name
      assert.strictEqual(filterOperatorInquiries(mockList, 'ana').length, 1);
      // Match by email
      assert.strictEqual(filterOperatorInquiries(mockList, 'empresa.com').length, 1);
      // Match by inquiry_type
      assert.strictEqual(filterOperatorInquiries(mockList, 'laboral').length, 1);
      // Match by message content
      assert.strictEqual(filterOperatorInquiries(mockList, 'tienda').length, 1);
      // Match by response content
      assert.strictEqual(filterOperatorInquiries(mockList, 'agendemos').length, 1);
      // Match by id string
      assert.strictEqual(filterOperatorInquiries(mockList, '102').length, 1);
      // Empty search returns all
      assert.strictEqual(filterOperatorInquiries(mockList, '').length, 2);
      // No matches returns empty
      assert.strictEqual(filterOperatorInquiries(mockList, 'criterio_sin_coincidencia').length, 0);
    });
  });

  /* =========================================================================
     SUITE 2: Admin Dashboard Metrics & Recharts Data Contracts
     ========================================================================= */
  describe('Suite 2: Admin Dashboard Metrics & Recharts Visualizations Contract', () => {
    test('2.1 Unauthenticated requests to /api/metrics return 401 Unauthorized', async () => {
      mockStorage.removeItem('token');
      await assert.rejects(
        async () => {
          await metricsApi.getMetrics();
        },
        (err) => {
          assert.strictEqual(err.status, 401);
          return true;
        }
      );
    });

    test('2.2 Normal user (usuario_normal) accessing /api/metrics returns 403 Forbidden', async () => {
      mockStorage.setItem('token', normalToken);
      await assert.rejects(
        async () => {
          await metricsApi.getMetrics();
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          return true;
        }
      );
    });

    test('2.3 Operator (operador) accessing /api/metrics returns 403 Forbidden', async () => {
      mockStorage.setItem('token', operatorToken);
      await assert.rejects(
        async () => {
          await metricsApi.getMetrics();
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          return true;
        }
      );
    });

    test('2.4 Administrator accesses /api/metrics successfully (200 OK)', async () => {
      mockStorage.setItem('token', adminToken);
      const metrics = await metricsApi.getMetrics();
      assert.ok(metrics, 'Expected metrics object');
    });

    test('2.5 KPI counters schema contract: all primary metrics exist and are non-negative numbers', async () => {
      mockStorage.setItem('token', adminToken);
      const metrics = await metricsApi.getMetrics();

      const requiredNumericKeys = [
        'visitas_generales',
        'accesos_autenticados',
        'total_users',
        'total_projects',
        'total_services',
        'total_messages',
        'pending_messages',
        'responded_messages',
      ];

      for (const key of requiredNumericKeys) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(metrics, key),
          `Missing required KPI counter: ${key}`
        );
        assert.strictEqual(
          typeof metrics[key],
          'number',
          `Expected ${key} to be a number, got ${typeof metrics[key]}`
        );
        assert.ok(metrics[key] >= 0, `Expected ${key} to be >= 0, got ${metrics[key]}`);
      }
    });

    test('2.6 Recharts inquiriesByType dataset schema: array of { type: string, count: number }', async () => {
      mockStorage.setItem('token', adminToken);
      const metrics = await metricsApi.getMetrics();

      assert.ok(Array.isArray(metrics.inquiriesByType), 'Expected inquiriesByType to be an Array');
      for (const item of metrics.inquiriesByType) {
        assert.ok(typeof item.type === 'string', 'Expected item.type to be string');
        assert.strictEqual(typeof Number(item.count), 'number', 'Expected item.count to be numeric');
        assert.ok(!isNaN(Number(item.count)), 'Expected item.count not to be NaN');
      }
    });

    test('2.7 Recharts registrationsTimeline dataset schema: array of { date: string, count: number }', async () => {
      mockStorage.setItem('token', adminToken);
      const metrics = await metricsApi.getMetrics();

      assert.ok(Array.isArray(metrics.registrationsTimeline), 'Expected registrationsTimeline to be an Array');
      for (const item of metrics.registrationsTimeline) {
        assert.ok(typeof item.date === 'string', 'Expected item.date to be string');
        assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date), `Expected date format YYYY-MM-DD, got ${item.date}`);
        assert.strictEqual(typeof Number(item.count), 'number', 'Expected item.count to be numeric');
        assert.ok(!isNaN(Number(item.count)), 'Expected item.count not to be NaN');
      }
    });

    test('2.8 formatInquiryType translates standard types and provides capitalization fallback', () => {
      assert.strictEqual(formatInquiryType('trabajo'), 'Oferta Laboral');
      assert.strictEqual(formatInquiryType('colaboracion'), 'Colaboración');
      assert.strictEqual(formatInquiryType('consulta_general'), 'Consulta General');
      assert.strictEqual(formatInquiryType('soporte'), 'Soporte Técnico');
      assert.strictEqual(formatInquiryType('otro'), 'Otro Asunto');
      // Case insensitive
      assert.strictEqual(formatInquiryType('TRABAJO'), 'Oferta Laboral');
      // Unknown category fallback
      assert.strictEqual(formatInquiryType('presupuesto'), 'Presupuesto');
      // Empty or null
      assert.strictEqual(formatInquiryType(null), 'General');
      assert.strictEqual(formatInquiryType(''), 'General');
    });

    test('2.9 transformInquiriesForRecharts produces expected BarChart dataset without NaN', async () => {
      mockStorage.setItem('token', adminToken);
      const metrics = await metricsApi.getMetrics();
      const chartData = transformInquiriesForRecharts(metrics);

      assert.ok(Array.isArray(chartData));
      for (const barItem of chartData) {
        assert.ok(typeof barItem.name === 'string');
        assert.strictEqual(typeof barItem.count, 'number');
        assert.ok(!isNaN(barItem.count));
        assert.ok(barItem.count >= 0);
      }
    });

    test('2.10 transformTimelineForRecharts produces expected AreaChart dataset with formatted date', async () => {
      mockStorage.setItem('token', adminToken);
      const metrics = await metricsApi.getMetrics();
      const timelineData = transformTimelineForRecharts(metrics);

      assert.ok(Array.isArray(timelineData));
      for (const areaItem of timelineData) {
        assert.ok(typeof areaItem.date === 'string');
        assert.ok(typeof areaItem.fullDate === 'string');
        assert.strictEqual(typeof areaItem.count, 'number');
        assert.ok(!isNaN(areaItem.count));
        assert.ok(areaItem.count >= 0);
        assert.strictEqual(areaItem.date, areaItem.fullDate.slice(5));
      }
    });

    test('2.11 Recharts transformer resilience: handles null, undefined, or empty metrics without throwing', () => {
      assert.deepStrictEqual(transformInquiriesForRecharts(null), []);
      assert.deepStrictEqual(transformInquiriesForRecharts(undefined), []);
      assert.deepStrictEqual(transformInquiriesForRecharts({}), []);
      assert.deepStrictEqual(transformInquiriesForRecharts({ inquiriesByType: 'not_an_array' }), []);

      assert.deepStrictEqual(transformTimelineForRecharts(null), []);
      assert.deepStrictEqual(transformTimelineForRecharts(undefined), []);
      assert.deepStrictEqual(transformTimelineForRecharts({}), []);
      assert.deepStrictEqual(transformTimelineForRecharts({ registrationsTimeline: null }), []);
    });

    test('2.12 Recharts transformer resilience: handles missing item properties safely', () => {
      const corruptedMetrics = {
        inquiriesByType: [
          { type: null, count: undefined },
          { type: 'trabajo', count: '5' },
          { count: 2 },
        ],
        registrationsTimeline: [
          { date: null, count: null },
          { date: '2026-11-01', count: '10' },
          {},
        ],
      };

      const inqData = transformInquiriesForRecharts(corruptedMetrics);
      assert.strictEqual(inqData.length, 3);
      assert.strictEqual(inqData[0].name, 'General');
      assert.strictEqual(inqData[0].count, 0);
      assert.strictEqual(inqData[1].name, 'Oferta Laboral');
      assert.strictEqual(inqData[1].count, 5);

      const timeData = transformTimelineForRecharts(corruptedMetrics);
      assert.strictEqual(timeData.length, 3);
      assert.strictEqual(timeData[0].date, '');
      assert.strictEqual(timeData[0].count, 0);
      assert.strictEqual(timeData[1].date, '11-01');
      assert.strictEqual(timeData[1].count, 10);
    });
  });

  /* =========================================================================
     SUITE 3: Administrative Lockout Prevention & Multi-Admin Lifecycle
     ========================================================================= */
  describe('Suite 3: Administrative Lockout Prevention & Invariants', () => {
    let temporaryUserId = null;

    before(async () => {
      // Register a temporary user to test promotion/demotion/deletion
      const tempEmail = `temp_admin_test_${Date.now()}@portfolio.local`;
      const reg = await authApi.register({
        name: 'Temp Test User',
        email: tempEmail,
        password: 'Password123!',
      });
      temporaryUserId = reg.user.id;
    });

    test('3.1 Unauthenticated requests to /api/users return 401 Unauthorized', async () => {
      mockStorage.removeItem('token');
      await assert.rejects(
        async () => {
          await usersApi.list();
        },
        (err) => {
          assert.strictEqual(err.status, 401);
          return true;
        }
      );
    });

    test('3.2 Normal user (usuario_normal) accessing /api/users returns 403 Forbidden', async () => {
      mockStorage.setItem('token', normalToken);
      await assert.rejects(
        async () => {
          await usersApi.list();
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          return true;
        }
      );
    });

    test('3.3 Admin retrieves all users; password_hash is strictly omitted from all records', async () => {
      mockStorage.setItem('token', adminToken);
      const users = await usersApi.list();
      assert.ok(Array.isArray(users));
      assert.ok(users.length >= 3);

      for (const u of users) {
        assert.ok(u.id);
        assert.ok(u.name);
        assert.ok(u.email);
        assert.ok(u.role);
        assert.strictEqual(u.password_hash, undefined, 'password_hash must NEVER be exposed in /api/users');
        assert.strictEqual(u.password, undefined, 'password must NEVER be exposed in /api/users');
      }
    });

    test('3.4 Self-deletion prevention: Admin cannot delete their own account (HTTP 400)', async () => {
      mockStorage.setItem('token', adminToken);
      await assert.rejects(
        async () => {
          await apiRequest(`/users/${adminUser.id}`, { method: 'DELETE' });
        },
        (err) => {
          assert.strictEqual(err.status, 400);
          assert.ok(
            err.message.includes('No puede eliminar su propia cuenta') ||
              err.message.includes('propia cuenta')
          );
          return true;
        }
      );
    });

    test('3.5 Last admin demotion prevention: Demoting the only admin to usuario_normal is rejected (HTTP 400)', async () => {
      mockStorage.setItem('token', adminToken);
      // Verify admin count
      const users = await usersApi.list();
      const admins = users.filter((u) => u.role === 'administrador');
      assert.strictEqual(admins.length, 1, 'Precondition: Exactly 1 administrator exists in database');

      await assert.rejects(
        async () => {
          await usersApi.updateRole(adminUser.id, 'usuario_normal');
        },
        (err) => {
          assert.strictEqual(err.status, 400);
          assert.ok(
            err.message.includes('único administrador') ||
              err.message.includes('bloqueo')
          );
          return true;
        }
      );
    });

    test('3.6 Last admin demotion prevention: Demoting the only admin to operador is rejected (HTTP 400)', async () => {
      mockStorage.setItem('token', adminToken);
      await assert.rejects(
        async () => {
          await usersApi.updateRole(adminUser.id, 'operador');
        },
        (err) => {
          assert.strictEqual(err.status, 400);
          assert.ok(err.message.includes('único administrador'));
          return true;
        }
      );
    });

    test('3.7 Last admin deletion prevention: Deleting the only admin account is rejected (HTTP 400)', async () => {
      // Even if called by another route or if ID was passed
      mockStorage.setItem('token', adminToken);
      await assert.rejects(
        async () => {
          await apiRequest(`/users/${adminUser.id}`, { method: 'DELETE' });
        },
        (err) => {
          assert.strictEqual(err.status, 400);
          return true;
        }
      );
    });

    test('3.8 Role validation: invalid roles are rejected with 400 Bad Request', async () => {
      mockStorage.setItem('token', adminToken);
      const invalidRoles = ['superadmin', 'root', 'invitado', '', '   '];
      for (const badRole of invalidRoles) {
        await assert.rejects(
          async () => {
            await usersApi.updateRole(temporaryUserId, badRole);
          },
          (err) => {
            assert.strictEqual(err.status, 400);
            return true;
          }
        );
      }
    });

    test('3.9 Multi-admin lifecycle: Promoting temporary user to administrador succeeds (200 OK)', async () => {
      mockStorage.setItem('token', adminToken);
      const updated = await usersApi.updateRole(temporaryUserId, 'administrador');
      assert.strictEqual(updated.role, 'administrador');

      const allUsers = await usersApi.list();
      const adminCount = allUsers.filter((u) => u.role === 'administrador').length;
      assert.strictEqual(adminCount, 2, 'There are now 2 administrators');
    });

    test('3.10 Multi-admin lifecycle: When 2 admins exist, demoting the other admin succeeds (200 OK)', async () => {
      mockStorage.setItem('token', adminToken);
      // Since 2 admins exist, adminUser can demote temporaryUserId
      const demoted = await usersApi.updateRole(temporaryUserId, 'operador');
      assert.strictEqual(demoted.role, 'operador');

      const allUsers = await usersApi.list();
      const adminCount = allUsers.filter((u) => u.role === 'administrador').length;
      assert.strictEqual(adminCount, 1, 'Only 1 administrator remains');
    });

    test('3.11 Multi-admin lifecycle: Re-arming lockout: once back to 1 admin, demotion is blocked again', async () => {
      mockStorage.setItem('token', adminToken);
      await assert.rejects(
        async () => {
          await usersApi.updateRole(adminUser.id, 'usuario_normal');
        },
        (err) => {
          assert.strictEqual(err.status, 400);
          assert.ok(err.message.includes('único administrador'));
          return true;
        }
      );
    });

    test('3.12 Multi-admin lifecycle: Promoting then deleting second admin works, but self-deletion remains blocked', async () => {
      mockStorage.setItem('token', adminToken);
      // Promote again
      await usersApi.updateRole(temporaryUserId, 'administrador');

      // AdminUser attempts self-deletion -> Still rejected!
      await assert.rejects(
        async () => {
          await apiRequest(`/users/${adminUser.id}`, { method: 'DELETE' });
        },
        (err) => {
          assert.strictEqual(err.status, 400);
          assert.ok(err.message.includes('propia cuenta'));
          return true;
        }
      );

      // AdminUser deletes the second admin -> Allowed!
      const delRes = await apiRequest(`/users/${temporaryUserId}`, { method: 'DELETE' });
      assert.strictEqual(delRes.success, true);
      assert.strictEqual(delRes.id, temporaryUserId);

      // Verify second admin is gone
      const allUsers = await usersApi.list();
      assert.strictEqual(allUsers.some((u) => u.id === temporaryUserId), false);
      const remainingAdmins = allUsers.filter((u) => u.role === 'administrador').length;
      assert.strictEqual(remainingAdmins, 1);
    });

    test('3.13 Client-side UI validation invariants: validateClientSideUserDeletion blocks dangerous operations', () => {
      // 1. Self deletion
      const selfCheck = validateClientSideUserDeletion({
        authUser: { id: 1, role: 'administrador' },
        userToDelete: { id: 1, role: 'administrador' },
        totalAdmins: 2,
      });
      assert.strictEqual(selfCheck.allowed, false);
      assert.ok(selfCheck.error.includes('propia cuenta'));

      // 2. Last admin deletion
      const lastAdminCheck = validateClientSideUserDeletion({
        authUser: { id: 1, role: 'administrador' },
        userToDelete: { id: 2, role: 'administrador' },
        totalAdmins: 1,
      });
      assert.strictEqual(lastAdminCheck.allowed, false);
      assert.ok(lastAdminCheck.error.includes('único administrador'));

      // 3. Normal deletion allowed
      const validCheck = validateClientSideUserDeletion({
        authUser: { id: 1, role: 'administrador' },
        userToDelete: { id: 5, role: 'usuario_normal' },
        totalAdmins: 1,
      });
      assert.strictEqual(validCheck.allowed, true);
      assert.strictEqual(validCheck.error, null);
    });

    test('3.14 Client-side UI validation invariants: validateClientSideRoleUpdate blocks sole admin demotion', () => {
      // 1. Sole admin demotion to normal user
      const soleCheck1 = validateClientSideRoleUpdate({
        userToUpdateRole: { id: 1, role: 'administrador' },
        selectedRole: 'usuario_normal',
        totalAdmins: 1,
      });
      assert.strictEqual(soleCheck1.allowed, false);
      assert.ok(soleCheck1.error.includes('único administrador'));

      // 2. Sole admin demotion to operator
      const soleCheck2 = validateClientSideRoleUpdate({
        userToUpdateRole: { id: 1, role: 'administrador' },
        selectedRole: 'operador',
        totalAdmins: 1,
      });
      assert.strictEqual(soleCheck2.allowed, false);
      assert.ok(soleCheck2.error.includes('único administrador'));

      // 3. Admin role update when multiple admins exist
      const multiCheck = validateClientSideRoleUpdate({
        userToUpdateRole: { id: 2, role: 'administrador' },
        selectedRole: 'operador',
        totalAdmins: 2,
      });
      assert.strictEqual(multiCheck.allowed, true);
      assert.strictEqual(multiCheck.error, null);

      // 4. Updating non-admin user role
      const normalUpdate = validateClientSideRoleUpdate({
        userToUpdateRole: { id: 3, role: 'usuario_normal' },
        selectedRole: 'operador',
        totalAdmins: 1,
      });
      assert.strictEqual(normalUpdate.allowed, true);
      assert.strictEqual(normalUpdate.error, null);
    });

    test('3.15 Relational integrity on user removal: contact messages decouple user_id to NULL', async () => {
      // 1. Register user
      const tempEmail = `inq_cascade_${Date.now()}@portfolio.local`;
      const regRes = await authApi.register({
        name: 'Inquiry Cascade Tester',
        email: tempEmail,
        password: 'Password123!',
      });
      const userId = regRes.user.id;
      const userToken = regRes.token;

      // 2. Submit authenticated contact inquiry
      mockStorage.setItem('token', userToken);
      const inqRes = await contactApi.submit({
        name: 'Inquiry Cascade Tester',
        email: tempEmail,
        inquiry_type: 'Colaboración',
        message: 'Consulta de prueba para verificar preservación referencial ON DELETE SET NULL.',
      });
      assert.strictEqual(inqRes.user_id, userId);
      const inqId = inqRes.id;

      // 3. Admin deletes user account
      mockStorage.setItem('token', adminToken);
      await apiRequest(`/users/${userId}`, { method: 'DELETE' });

      // 4. Operator inspects inquiry: message still exists, user_id is now NULL
      mockStorage.setItem('token', operatorToken);
      const preservedInquiry = await operatorApi.getMessageById(inqId);
      assert.ok(preservedInquiry, 'Inquiry must be preserved in SQLite');
      assert.strictEqual(preservedInquiry.id, inqId);
      assert.strictEqual(preservedInquiry.user_id, null, 'user_id must be set to null via foreign key ON DELETE SET NULL');
      assert.strictEqual(preservedInquiry.name, 'Inquiry Cascade Tester');
    });
  });
});
