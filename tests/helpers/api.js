/**
 * HTTP Client Wrapper for E2E Tests using Native fetch (Node 24)
 */
const config = require('./config');

class ApiClient {
  constructor(baseUrl = config.apiUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async request(method, endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = {
      ...(options.headers || {})
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    let body = options.body;
    if (body !== undefined && body !== null && typeof body === 'object' && !(body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || config.requestTimeoutMs);

    const start = Date.now();
    let response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal
      });
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`HTTP request timed out after ${config.requestTimeoutMs}ms: [${method} ${url}]`);
      }
      throw new Error(`HTTP request failed [${method} ${url}]: ${err.message}`);
    } finally {
      clearTimeout(timeout);
    }

    const duration = Date.now() - start;
    const contentType = response.headers.get('content-type') || '';
    let data = null;
    let rawText = '';

    try {
      rawText = await response.text();
      if (contentType.includes('application/json') || (rawText.trim().startsWith('{') || rawText.trim().startsWith('['))) {
        data = JSON.parse(rawText);
      } else {
        data = rawText;
      }
    } catch {
      data = rawText;
    }

    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: response.headers,
      data,
      rawText,
      duration,
      url
    };
  }

  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, options);
  }

  async post(endpoint, body, options = {}) {
    return this.request('POST', endpoint, { ...options, body });
  }

  async put(endpoint, body, options = {}) {
    return this.request('PUT', endpoint, { ...options, body });
  }

  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, options);
  }

  async isServerReachable() {
    try {
      const res = await this.get('/api/health', { timeoutMs: 2000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  async login(email, password) {
    const res = await this.post('/api/auth/login', { email, password });
    if (res.status === 200 && res.data && res.data.token) {
      return {
        token: res.data.token,
        user: res.data.user
      };
    }
    throw new Error(`Login failed for ${email} (status: ${res.status}): ${JSON.stringify(res.data)}`);
  }

  async loginAs(role) {
    const creds = config.defaultCredentials[role];
    if (!creds) {
      throw new Error(`No credentials configured for role: ${role}`);
    }
    return this.login(creds.email, creds.password);
  }
}

module.exports = new ApiClient();
