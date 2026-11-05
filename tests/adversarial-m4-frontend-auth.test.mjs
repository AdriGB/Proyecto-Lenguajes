/**
 * Adversarial Test Suite for Milestone 4 (Frontend Core & Public UI)
 * Focus: Auth State Transitions, api.js Request Wrapper, Token Injection, Form Validation Edge Cases,
 * and Live Fullstack HTTP Integration.
 * 
 * Zero-dependency native Node.js 24 test harness (`node:test`, `node:assert/strict`).
 */
import test, { describe, beforeEach, after, before } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Import the actual api client implemented in Milestone 4
import apiDefault, {
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

// Validation logic mirrors frontend components
function validateLogin(formData) {
  const newErrors = {};
  const trimmedEmail = formData.email ? formData.email.trim() : '';

  if (!trimmedEmail) {
    newErrors.email = 'El correo electrónico es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    newErrors.email = 'Ingresa un formato de correo válido (ej: usuario@dominio.com)';
  }

  if (!formData.password) {
    newErrors.password = 'La contraseña es obligatoria';
  }

  return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
}

function validateRegister(formData) {
  const newErrors = {};
  const trimmedName = formData.name ? formData.name.trim() : '';
  const trimmedEmail = formData.email ? formData.email.trim() : '';

  if (!trimmedName) {
    newErrors.name = 'El nombre es obligatorio';
  } else if (trimmedName.length < 2) {
    newErrors.name = 'El nombre debe tener al menos 2 caracteres';
  }

  if (!trimmedEmail) {
    newErrors.email = 'El correo electrónico es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    newErrors.email = 'Ingresa un formato de correo válido (ej: usuario@dominio.com)';
  }

  if (!formData.password) {
    newErrors.password = 'La contraseña es obligatoria';
  } else if (formData.password.length < 6) {
    newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
  }

  if (!formData.confirmPassword) {
    newErrors.confirmPassword = 'Debes confirmar la contraseña';
  } else if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Las contraseñas no coinciden';
  }

  return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
}

function validateContact(formData) {
  const errors = {};
  if (!formData.name?.trim() || formData.name.trim().length < 2) {
    errors.name = 'El nombre es obligatorio y debe tener al menos 2 caracteres.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email?.trim() || !emailRegex.test(formData.email.trim())) {
    errors.email = 'Introduce un correo electrónico válido.';
  }
  if (!formData.inquiry_type?.trim()) {
    errors.inquiry_type = 'Selecciona un tipo de consulta.';
  }
  if (!formData.message?.trim() || formData.message.trim().length < 10) {
    errors.message = 'El mensaje debe tener al menos 10 caracteres.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

// Replicate AuthContext state machine transitions to stress-test in isolation
class AuthStateMachine {
  constructor(storage, api) {
    this.storage = storage;
    this.api = api;
    this.token = this.storage.getItem('token') || null;
    let savedUser = null;
    try {
      const saved = this.storage.getItem('user');
      savedUser = saved ? JSON.parse(saved) : null;
    } catch {
      savedUser = null;
    }
    this.user = savedUser;
    this.loading = true;
  }

  get isAuthenticated() {
    return Boolean(this.token && this.user);
  }

  get role() {
    return this.user?.role || null;
  }

  async verifySession() {
    const storedToken = this.storage.getItem('token');
    if (!storedToken) {
      this.loading = false;
      return;
    }

    try {
      const data = await this.api.me();
      if (data && data.user) {
        this.user = data.user;
        this.storage.setItem('user', JSON.stringify(data.user));
      }
    } catch {
      this.token = null;
      this.user = null;
      this.storage.removeItem('token');
      this.storage.removeItem('user');
    } finally {
      this.loading = false;
    }
  }

  async login(emailOrToken, passwordOrUser) {
    if (typeof emailOrToken === 'string' && typeof passwordOrUser === 'object' && passwordOrUser !== null) {
      const newToken = emailOrToken;
      const newUser = passwordOrUser;
      this.token = newToken;
      this.user = newUser;
      this.storage.setItem('token', newToken);
      this.storage.setItem('user', JSON.stringify(newUser));
      return { success: true, user: newUser, token: newToken };
    }

    const email = emailOrToken;
    const password = passwordOrUser;
    const data = await this.api.login({ email, password });
    const { token: newToken, user: newUser } = data;

    this.token = newToken;
    this.user = newUser;
    this.storage.setItem('token', newToken);
    this.storage.setItem('user', JSON.stringify(newUser));

    return { success: true, user: newUser, token: newToken };
  }

  async register(name, email, password) {
    const data = await this.api.register({ name, email, password });
    const { token: newToken, user: newUser } = data;

    this.token = newToken;
    this.user = newUser;
    this.storage.setItem('token', newToken);
    this.storage.setItem('user', JSON.stringify(newUser));

    return { success: true, user: newUser, token: newToken };
  }

  logout() {
    this.token = null;
    this.user = null;
    this.storage.removeItem('token');
    this.storage.removeItem('user');
  }
}

describe('Milestone 4 Adversarial Challenges: Frontend Core & Auth', () => {
  let mockStorage;
  let originalFetch;
  let serverProcess = null;

  before(async () => {
    mockStorage = new MockLocalStorage();
    globalThis.localStorage = mockStorage;
    originalFetch = globalThis.fetch;

    // Check if backend is running, if not spawn it
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
        stdio: 'ignore'
      });

      const start = Date.now();
      while (Date.now() - start < 6000) {
        await new Promise(r => setTimeout(r, 200));
        try {
          const res = await originalFetch('http://localhost:5000/api/health');
          if (res.status === 200) {
            serverRunning = true;
            break;
          }
        } catch {}
      }
    }
  });

  beforeEach(() => {
    mockStorage.clear();
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

  /* =========================================================================
     SUITE 1: api.js Request Wrapper & Token Injection
     ========================================================================= */
  describe('Suite 1: api.js Request Wrapper & Token Injection Under Pressure', () => {
    test('1.1 Automatic Bearer token injection when token exists in localStorage', async () => {
      mockStorage.setItem('token', 'test-jwt-token-12345');

      let interceptedUrl = null;
      let interceptedHeaders = null;

      globalThis.fetch = async (url, config) => {
        interceptedUrl = url;
        interceptedHeaders = config.headers;
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok' }),
        };
      };

      const result = await apiRequest('/health');
      assert.strictEqual(interceptedUrl, '/api/health');
      assert.strictEqual(interceptedHeaders['Authorization'], 'Bearer test-jwt-token-12345');
      assert.strictEqual(interceptedHeaders['Content-Type'], 'application/json');
      assert.deepStrictEqual(result, { status: 'ok' });
    });

    test('1.2 Omits Authorization header when localStorage has NO token', async () => {
      mockStorage.removeItem('token');

      let interceptedHeaders = null;
      globalThis.fetch = async (url, config) => {
        interceptedHeaders = config.headers;
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok' }),
        };
      };

      await apiRequest('/health');
      assert.strictEqual(interceptedHeaders['Authorization'], undefined);
      assert.strictEqual(interceptedHeaders['Content-Type'], 'application/json');
    });

    test('1.3 Omits Authorization header when token is empty string', async () => {
      mockStorage.setItem('token', '');

      let interceptedHeaders = null;
      globalThis.fetch = async (url, config) => {
        interceptedHeaders = config.headers;
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok' }),
        };
      };

      await apiRequest('/health');
      assert.strictEqual(interceptedHeaders['Authorization'], undefined);
    });

    test('1.4 Caller-supplied Authorization header overrides stored localStorage token', async () => {
      mockStorage.setItem('token', 'stored-token');

      let interceptedHeaders = null;
      globalThis.fetch = async (url, config) => {
        interceptedHeaders = config.headers;
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok' }),
        };
      };

      await apiRequest('/health', {
        headers: { Authorization: 'Bearer custom-override-token' },
      });
      assert.strictEqual(interceptedHeaders['Authorization'], 'Bearer custom-override-token');
    });

    test('1.5 Automatic JSON serialization of JavaScript object body', async () => {
      let interceptedBody = null;
      let interceptedContentType = null;

      globalThis.fetch = async (url, config) => {
        interceptedBody = config.body;
        interceptedContentType = config.headers['Content-Type'];
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        };
      };

      const payload = { email: 'user@portfolio.local', count: 42, active: true };
      await apiRequest('/test', { method: 'POST', body: payload });

      assert.strictEqual(interceptedBody, JSON.stringify(payload));
      assert.strictEqual(interceptedContentType, 'application/json');
    });

    test('1.6 String body is not double-stringified', async () => {
      let interceptedBody = null;

      globalThis.fetch = async (url, config) => {
        interceptedBody = config.body;
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        };
      };

      const rawJson = '{"already":"stringified"}';
      await apiRequest('/test', { method: 'POST', body: rawJson });

      assert.strictEqual(interceptedBody, rawJson);
    });

    test('1.7 Undefined body does not inject empty body into fetch config', async () => {
      let interceptedConfig = null;

      globalThis.fetch = async (url, config) => {
        interceptedConfig = config;
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        };
      };

      await apiRequest('/test', { method: 'GET' });
      assert.strictEqual('body' in interceptedConfig, false);
    });

    test('1.8 Normalizes HTTP 400 Bad Request error object into thrown Error with status & data', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Formato de correo inválido' }),
      });

      await assert.rejects(
        async () => {
          await apiRequest('/auth/register', { method: 'POST', body: {} });
        },
        (err) => {
          assert.strictEqual(err.message, 'Formato de correo inválido');
          assert.strictEqual(err.status, 400);
          assert.deepStrictEqual(err.data, { error: 'Formato de correo inválido' });
          return true;
        }
      );
    });

    test('1.9 Normalizes HTTP 401 Unauthorized message into thrown Error', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Credenciales inválidas' }),
      });

      await assert.rejects(
        async () => {
          await apiRequest('/auth/login', { method: 'POST', body: {} });
        },
        (err) => {
          assert.strictEqual(err.message, 'Credenciales inválidas');
          assert.strictEqual(err.status, 401);
          return true;
        }
      );
    });

    test('1.10 Normalizes HTTP 500 HTML/non-JSON response gracefully to "Error HTTP 500"', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Unexpected token < in JSON at position 0');
        },
      });

      await assert.rejects(
        async () => {
          await apiRequest('/crashed-endpoint');
        },
        (err) => {
          assert.strictEqual(err.message, 'Error HTTP 500');
          assert.strictEqual(err.status, 500);
          assert.strictEqual(err.data, null);
          return true;
        }
      );
    });

    test('1.11 projectsApi.list(params) builds properly URL-encoded query string', async () => {
      let interceptedUrl = null;
      globalThis.fetch = async (url) => {
        interceptedUrl = url;
        return { ok: true, status: 200, json: async () => [] };
      };

      await projectsApi.list({ category: 'Fullstack & Web', is_published: 'true', page: '1' });
      assert.strictEqual(
        interceptedUrl,
        '/api/projects?category=Fullstack+%26+Web&is_published=true&page=1'
      );
    });

    test('1.12 operatorApi.getMessages(status) encodes status filter parameter correctly', async () => {
      let interceptedUrl = null;
      globalThis.fetch = async (url) => {
        interceptedUrl = url;
        return { ok: true, status: 200, json: async () => [] };
      };

      await operatorApi.getMessages('pendiente');
      assert.strictEqual(interceptedUrl, '/api/operator/messages?status=pendiente');

      await operatorApi.getMessages();
      assert.strictEqual(interceptedUrl, '/api/operator/messages');
    });

    test('1.13 All domain namespaces exist and are complete on default export', () => {
      assert.strictEqual(typeof apiDefault.apiRequest, 'function');
      assert.strictEqual(typeof apiDefault.auth.login, 'function');
      assert.strictEqual(typeof apiDefault.auth.register, 'function');
      assert.strictEqual(typeof apiDefault.auth.me, 'function');
      assert.strictEqual(typeof apiDefault.services.list, 'function');
      assert.strictEqual(typeof apiDefault.services.create, 'function');
      assert.strictEqual(typeof apiDefault.projects.preview, 'function');
      assert.strictEqual(typeof apiDefault.projects.list, 'function');
      assert.strictEqual(typeof apiDefault.contact.submit, 'function');
      assert.strictEqual(typeof apiDefault.metrics.recordVisit, 'function');
      assert.strictEqual(typeof apiDefault.metrics.getMetrics, 'function');
      assert.strictEqual(typeof apiDefault.operator.getMessages, 'function');
      assert.strictEqual(typeof apiDefault.operator.respondMessage, 'function');
      assert.strictEqual(typeof apiDefault.users.list, 'function');
      assert.strictEqual(typeof apiDefault.users.updateRole, 'function');
    });
  });

  /* =========================================================================
     SUITE 2: Auth State Transitions & Session Resilience
     ========================================================================= */
  describe('Suite 2: Auth State Transitions & Session Resilience', () => {
    test('2.1 Clean initial state yields unauthenticated visitor with null role', () => {
      const auth = new AuthStateMachine(mockStorage, authApi);
      assert.strictEqual(auth.token, null);
      assert.strictEqual(auth.user, null);
      assert.strictEqual(auth.isAuthenticated, false);
      assert.strictEqual(auth.role, null);
      assert.strictEqual(auth.loading, true);
    });

    test('2.2 Corrupted user JSON in localStorage does not crash and defaults to null', () => {
      mockStorage.setItem('token', 'some-valid-token');
      mockStorage.setItem('user', '{invalid:broken:json]');

      const auth = new AuthStateMachine(mockStorage, authApi);
      assert.strictEqual(auth.token, 'some-valid-token');
      assert.strictEqual(auth.user, null);
      assert.strictEqual(auth.isAuthenticated, false);
    });

    test('2.3 verifySession with valid token populates user profile and syncs storage', async () => {
      mockStorage.setItem('token', 'valid-jwt');

      const mockApi = {
        me: async () => ({
          user: { id: 1, name: 'Admin User', email: 'admin@portfolio.local', role: 'administrador' },
        }),
      };

      const auth = new AuthStateMachine(mockStorage, mockApi);
      await auth.verifySession();

      assert.strictEqual(auth.loading, false);
      assert.strictEqual(auth.isAuthenticated, true);
      assert.strictEqual(auth.role, 'administrador');
      assert.strictEqual(auth.user.name, 'Admin User');
      assert.strictEqual(
        mockStorage.getItem('user'),
        JSON.stringify({ id: 1, name: 'Admin User', email: 'admin@portfolio.local', role: 'administrador' })
      );
    });

    test('2.4 verifySession with expired/invalid token (401) clears storage and resets session', async () => {
      mockStorage.setItem('token', 'expired-jwt');
      mockStorage.setItem('user', JSON.stringify({ id: 2, name: 'Old User', role: 'usuario_normal' }));

      const mockApi = {
        me: async () => {
          const err = new Error('Token expirado');
          err.status = 401;
          throw err;
        },
      };

      const auth = new AuthStateMachine(mockStorage, mockApi);
      await auth.verifySession();

      assert.strictEqual(auth.loading, false);
      assert.strictEqual(auth.token, null);
      assert.strictEqual(auth.user, null);
      assert.strictEqual(auth.isAuthenticated, false);
      assert.strictEqual(auth.role, null);
      assert.strictEqual(mockStorage.getItem('token'), null);
      assert.strictEqual(mockStorage.getItem('user'), null);
    });

    test('2.5 Standard login credentials flow sets token, user and updates storage', async () => {
      const mockApi = {
        login: async ({ email, password }) => {
          if (email === 'op@local' && password === 'secret') {
            return {
              token: 'op-jwt-token',
              user: { id: 5, name: 'Operador', email: 'op@local', role: 'operador' },
            };
          }
          throw new Error('Credenciales inválidas');
        },
      };

      const auth = new AuthStateMachine(mockStorage, mockApi);
      const res = await auth.login('op@local', 'secret');

      assert.strictEqual(res.success, true);
      assert.strictEqual(auth.isAuthenticated, true);
      assert.strictEqual(auth.role, 'operador');
      assert.strictEqual(mockStorage.getItem('token'), 'op-jwt-token');
      assert.strictEqual(
        mockStorage.getItem('user'),
        JSON.stringify({ id: 5, name: 'Operador', email: 'op@local', role: 'operador' })
      );
    });

    test('2.6 Direct token/user login overload injects session immediately', async () => {
      const auth = new AuthStateMachine(mockStorage, {});
      const directToken = 'pre-authenticated-jwt';
      const directUser = { id: 9, name: 'Direct User', email: 'direct@local', role: 'usuario_normal' };

      const res = await auth.login(directToken, directUser);

      assert.strictEqual(res.success, true);
      assert.strictEqual(auth.token, directToken);
      assert.strictEqual(auth.user.name, 'Direct User');
      assert.strictEqual(auth.isAuthenticated, true);
      assert.strictEqual(auth.role, 'usuario_normal');
      assert.strictEqual(mockStorage.getItem('token'), directToken);
    });

    test('2.7 Failed credentials login leaves state unauthenticated and storage untouched', async () => {
      const mockApi = {
        login: async () => {
          const err = new Error('Credenciales inválidas');
          err.status = 401;
          throw err;
        },
      };

      const auth = new AuthStateMachine(mockStorage, mockApi);

      await assert.rejects(async () => {
        await auth.login('bad@local', 'wrongpass');
      });

      assert.strictEqual(auth.isAuthenticated, false);
      assert.strictEqual(auth.token, null);
      assert.strictEqual(auth.user, null);
      assert.strictEqual(mockStorage.getItem('token'), null);
    });

    test('2.8 Registration flow automatically activates authenticated session', async () => {
      const mockApi = {
        register: async ({ name, email }) => ({
          token: 'new-user-jwt',
          user: { id: 10, name, email, role: 'usuario_normal' },
        }),
      };

      const auth = new AuthStateMachine(mockStorage, mockApi);
      const res = await auth.register('Nuevo Alumno', 'alumno@portfolio.local', 'Pass123!');

      assert.strictEqual(res.success, true);
      assert.strictEqual(auth.isAuthenticated, true);
      assert.strictEqual(auth.role, 'usuario_normal');
      assert.strictEqual(mockStorage.getItem('token'), 'new-user-jwt');
    });

    test('2.9 Logout purges session from memory and localStorage', async () => {
      const auth = new AuthStateMachine(mockStorage, {});
      await auth.login('active-token', { id: 1, name: 'Admin', role: 'administrador' });

      assert.strictEqual(auth.isAuthenticated, true);

      auth.logout();

      assert.strictEqual(auth.token, null);
      assert.strictEqual(auth.user, null);
      assert.strictEqual(auth.isAuthenticated, false);
      assert.strictEqual(auth.role, null);
      assert.strictEqual(mockStorage.getItem('token'), null);
      assert.strictEqual(mockStorage.getItem('user'), null);
    });

    test('2.10 Multi-role transition lifecycle (Visitor -> Normal -> Logout -> Admin)', async () => {
      const auth = new AuthStateMachine(mockStorage, {});

      // 1. Visitor
      assert.strictEqual(auth.isAuthenticated, false);
      assert.strictEqual(auth.role, null);

      // 2. Normal user logs in
      await auth.login('tok-1', { id: 10, role: 'usuario_normal' });
      assert.strictEqual(auth.isAuthenticated, true);
      assert.strictEqual(auth.role, 'usuario_normal');

      // 3. Logout
      auth.logout();
      assert.strictEqual(auth.isAuthenticated, false);
      assert.strictEqual(auth.role, null);

      // 4. Admin logs in
      await auth.login('tok-2', { id: 1, role: 'administrador' });
      assert.strictEqual(auth.isAuthenticated, true);
      assert.strictEqual(auth.role, 'administrador');
    });
  });

  /* =========================================================================
     SUITE 3: Form Validation Edge Cases & Input Stress Testing
     ========================================================================= */
  describe('Suite 3: Form Validation Edge Cases & Input Stress Testing', () => {
    test('3.1 Login email validation handles empty, whitespace, and malformed inputs', () => {
      // Empty
      let res = validateLogin({ email: '', password: 'ValidPassword123' });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.email);

      // Whitespace only
      res = validateLogin({ email: '   ', password: 'ValidPassword123' });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.email);

      // Malformed emails
      const invalidEmails = [
        'plainaddress',
        '#@%^%#$@#$@#.com',
        '@example.com',
        'Joe Smith <email@example.com>',
        'email.example.com',
        'email@example@example.com',
        'email@example',
      ];
      for (const bad of invalidEmails) {
        res = validateLogin({ email: bad, password: 'ValidPassword123' });
        assert.strictEqual(res.isValid, false, `Expected ${bad} to be invalid`);
        assert.ok(res.errors.email);
      }

      // Valid email
      res = validateLogin({ email: 'admin@portfolio.local', password: 'ValidPassword123' });
      assert.strictEqual(res.isValid, true);
    });

    test('3.2 Login password validation rejects empty password', () => {
      let res = validateLogin({ email: 'admin@portfolio.local', password: '' });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.password);

      res = validateLogin({ email: 'admin@portfolio.local', password: 'Password123!' });
      assert.strictEqual(res.isValid, true);
    });

    test('3.3 Register name validation boundary (< 2 chars rejected, >= 2 accepted)', () => {
      // Empty
      let res = validateRegister({ name: '', email: 'u@test.local', password: 'secret', confirmPassword: 'secret' });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.name);

      // 1 char boundary
      res = validateRegister({ name: 'A', email: 'u@test.local', password: 'secret', confirmPassword: 'secret' });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.name.includes('al menos 2 caracteres'));

      // 1 char with trailing spaces
      res = validateRegister({ name: ' A   ', email: 'u@test.local', password: 'secret', confirmPassword: 'secret' });
      assert.strictEqual(res.isValid, false);

      // 2 chars boundary (valid)
      res = validateRegister({ name: 'Al', email: 'u@test.local', password: 'secret', confirmPassword: 'secret' });
      assert.strictEqual(res.isValid, true);

      // Full realistic name
      res = validateRegister({ name: 'María García Rodríguez', email: 'u@test.local', password: 'secret', confirmPassword: 'secret' });
      assert.strictEqual(res.isValid, true);
    });

    test('3.4 Register password length boundary (< 6 chars rejected, >= 6 accepted)', () => {
      // 5 chars
      let res = validateRegister({ name: 'Carlos', email: 'c@test.local', password: '12345', confirmPassword: '12345' });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.password.includes('al menos 6 caracteres'));

      // 6 chars boundary (valid)
      res = validateRegister({ name: 'Carlos', email: 'c@test.local', password: '123456', confirmPassword: '123456' });
      assert.strictEqual(res.isValid, true);
    });

    test('3.5 Register confirmPassword matching boundary', () => {
      // Missing confirm password
      let res = validateRegister({ name: 'Carlos', email: 'c@test.local', password: 'SecretPassword', confirmPassword: '' });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.confirmPassword);

      // Mismatched passwords
      res = validateRegister({ name: 'Carlos', email: 'c@test.local', password: 'SecretPassword', confirmPassword: 'OtherPassword' });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.confirmPassword.includes('no coinciden'));

      // Matching passwords
      res = validateRegister({ name: 'Carlos', email: 'c@test.local', password: 'SecretPassword', confirmPassword: 'SecretPassword' });
      assert.strictEqual(res.isValid, true);
    });

    test('3.6 Contact form name boundary (< 2 chars rejected, >= 2 accepted)', () => {
      let res = validateContact({
        name: 'J',
        email: 'j@test.local',
        inquiry_type: 'Presupuesto',
        message: 'Hola, me interesa conocer los servicios técnicos ofrecidos.',
      });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.name);

      res = validateContact({
        name: 'Jo',
        email: 'j@test.local',
        inquiry_type: 'Presupuesto',
        message: 'Hola, me interesa conocer los servicios técnicos ofrecidos.',
      });
      assert.strictEqual(res.isValid, true);
    });

    test('3.7 Contact form email validation rejects invalid addresses', () => {
      let res = validateContact({
        name: 'Juan Pérez',
        email: 'invalid-email-address',
        inquiry_type: 'Consulta General',
        message: 'Hola, me interesa conocer los servicios técnicos ofrecidos.',
      });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.email);
    });

    test('3.8 Contact form message length boundary (< 10 chars rejected, >= 10 accepted)', () => {
      // 9 chars
      let res = validateContact({
        name: 'Juan Pérez',
        email: 'juan@test.local',
        inquiry_type: 'Consulta General',
        message: '123456789',
      });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.message.includes('al menos 10 caracteres'));

      // 10 chars boundary
      res = validateContact({
        name: 'Juan Pérez',
        email: 'juan@test.local',
        inquiry_type: 'Consulta General',
        message: '1234567890',
      });
      assert.strictEqual(res.isValid, true);
    });

    test('3.9 Contact form inquiry_type is required', () => {
      let res = validateContact({
        name: 'Juan Pérez',
        email: 'juan@test.local',
        inquiry_type: '   ',
        message: 'Hola, mensaje con más de diez caracteres.',
      });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.inquiry_type);
    });
  });

  /* =========================================================================
     SUITE 4: Live HTTP Fullstack Integration with api.js against Real Backend
     ========================================================================= */
  describe('Suite 4: Live HTTP Fullstack Integration with api.js against Real Backend', () => {
    const BACKEND_BASE = 'http://localhost:5000';

    before(() => {
      // Restore native fetch for real HTTP network requests against localhost:5000
      globalThis.fetch = async (url, config = {}) => {
        const fullUrl = url.startsWith('http') ? url : `${BACKEND_BASE}${url}`;
        return originalFetch(fullUrl, config);
      };
    });

    test('4.1 Live Health Check via apiRequest("/health")', async () => {
      const health = await apiRequest('/health');
      assert.strictEqual(health.status, 'ok');
      assert.ok(health.timestamp);
    });

    test('4.2 Live Public Services list via servicesApi.list()', async () => {
      const services = await servicesApi.list();
      assert.ok(Array.isArray(services));
      assert.ok(services.length >= 3, 'Expected at least 3 seeded services');
      assert.ok(services[0].title);
      assert.ok(services[0].icon);
    });

    test('4.3 Live Public Projects preview via projectsApi.preview()', async () => {
      const preview = await projectsApi.preview();
      assert.ok(Array.isArray(preview));
      assert.ok(preview.length >= 2, 'Expected preview projects');
      assert.strictEqual(preview[0].is_published, 1);
    });

    test('4.4 Live User Login via authApi.login({ email, password }) returns JWT', async () => {
      const res = await authApi.login({
        email: 'admin@portfolio.local',
        password: 'Admin123!',
      });
      assert.ok(res.token);
      assert.ok(res.user);
      assert.strictEqual(res.user.email, 'admin@portfolio.local');
      assert.strictEqual(res.user.role, 'administrador');
      assert.strictEqual('password_hash' in res.user, false);
    });

    test('4.5 Live Injected Token Profile via authApi.me()', async () => {
      // First log in to acquire genuine token
      const loginRes = await authApi.login({
        email: 'operador@portfolio.local',
        password: 'Operador123!',
      });

      // Inject into mock localStorage
      mockStorage.setItem('token', loginRes.token);

      // Call authApi.me() - apiRequest should read token and send Bearer header
      const meRes = await authApi.me();
      assert.ok(meRes.user);
      assert.strictEqual(meRes.user.email, 'operador@portfolio.local');
      assert.strictEqual(meRes.user.role, 'operador');
    });

    test('4.6 Live Authenticated Projects catalog via projectsApi.list()', async () => {
      const loginRes = await authApi.login({
        email: 'usuario@portfolio.local',
        password: 'Usuario123!',
      });
      mockStorage.setItem('token', loginRes.token);

      const catalog = await projectsApi.list();
      assert.ok(Array.isArray(catalog));
      assert.ok(catalog.length >= 3);
    });

    test('4.7 Live RBAC Enforcement: Normal user rejected from operatorApi.getMessages() with 403', async () => {
      const userRes = await authApi.login({
        email: 'usuario@portfolio.local',
        password: 'Usuario123!',
      });
      mockStorage.setItem('token', userRes.token);

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

    test('4.8 Live Operator Access: Operator succeeds on operatorApi.getMessages() with 200', async () => {
      const opRes = await authApi.login({
        email: 'operador@portfolio.local',
        password: 'Operador123!',
      });
      mockStorage.setItem('token', opRes.token);

      const messages = await operatorApi.getMessages();
      assert.ok(Array.isArray(messages));
    });

    test('4.9 Live Authenticated Contact Submission associates user_id', async () => {
      const userRes = await authApi.login({
        email: 'usuario@portfolio.local',
        password: 'Usuario123!',
      });
      mockStorage.setItem('token', userRes.token);

      const inquiry = {
        name: userRes.user.name,
        email: userRes.user.email,
        inquiry_type: 'Desarrollo Web / Solución Fullstack',
        message: 'Consulta de prueba automatizada enviada por challenger_m4_2.',
      };

      const res = await contactApi.submit(inquiry);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.user_id, userRes.user.id);
      assert.strictEqual(res.status, 'pendiente');
    });

    test('4.10 Live Guest Contact Submission sets user_id = null', async () => {
      // Clear token to simulate unauthenticated guest visitor
      mockStorage.removeItem('token');

      const guestInquiry = {
        name: 'Visitante Desconocido',
        email: 'invitado_m4@ejemplo.com',
        inquiry_type: 'Presupuesto y Cotización',
        message: 'Mensaje de visitante público sin iniciar sesión en la plataforma.',
      };

      const res = await contactApi.submit(guestInquiry);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.user_id, null);
      assert.strictEqual(res.status, 'pendiente');
    });

    test('4.11 Live Metrics Visit increment via metricsApi.recordVisit()', async () => {
      mockStorage.removeItem('token');
      const res = await metricsApi.recordVisit();
      assert.strictEqual(res.success, true);
      assert.ok(typeof res.count === 'number');
    });
  });
});
