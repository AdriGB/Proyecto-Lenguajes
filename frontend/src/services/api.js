/**
 * Centralized API client and REST endpoints for Portfolio Fullstack
 * Injects JWT Bearer token from localStorage, standardizes JSON serialization,
 * and formats structured error responses.
 */

const BASE_URL = '/api';

/**
 * Core fetch wrapper with automatic JWT header injection and unified error normalization
 * @param {string} endpoint - Relative path (e.g. '/auth/login')
 * @param {RequestInit & { body?: any }} options - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiRequest(endpoint, options = {}) {
  const { headers = {}, body, ...rest } = options;
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let finalBody = body;
  if (body !== undefined && body !== null && typeof body === 'object' && !(body instanceof FormData)) {
    finalBody = JSON.stringify(body);
  }

  const config = {
    headers: finalHeaders,
    ...(finalBody !== undefined ? { body: finalBody } : {}),
    ...rest,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      data?.error ||
      data?.message ||
      (typeof data === 'string' ? data : `Error HTTP ${response.status}`);
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Authentication Endpoints (RFC-compliant JWT + bcrypt)
 */
export const authApi = {
  /**
   * Log in user with credentials
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ message: string, token: string, user: { id: number, name: string, email: string, role: string } }>}
   */
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),

  /**
   * Register new user (assigned role 'usuario_normal')
   * @param {{ name: string, email: string, password: string }} userData
   * @returns {Promise<{ message: string, token: string, user: { id: number, name: string, email: string, role: string } }>}
   */
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: userData }),

  /**
   * Retrieve current user profile from token
   * @returns {Promise<{ user: { id: number, name: string, email: string, role: string } }>}
   */
  me: () => apiRequest('/auth/me', { method: 'GET' }),
};

/**
 * Services Endpoints
 */
export const servicesApi = {
  /**
   * List all published services (Public)
   * @returns {Promise<Array<{ id: number, title: string, description: string, icon: string, is_published: number }>>}
   */
  list: () => apiRequest('/services', { method: 'GET' }),

  /**
   * Create new service (Admin only)
   * @param {{ title: string, description: string, icon: string, is_published?: number }} serviceData
   */
  create: (serviceData) => apiRequest('/services', { method: 'POST', body: serviceData }),

  /**
   * Update existing service (Admin only)
   * @param {number|string} id
   * @param {{ title?: string, description?: string, icon?: string, is_published?: number }} serviceData
   */
  update: (id, serviceData) => apiRequest(`/services/${id}`, { method: 'PUT', body: serviceData }),

  /**
   * Delete service (Admin only)
   * @param {number|string} id
   */
  delete: (id) => apiRequest(`/services/${id}`, { method: 'DELETE' }),
};

/**
 * Projects Endpoints
 */
export const projectsApi = {
  /**
   * List public preview projects (Public)
   * @returns {Promise<Array<{ id: number, title: string, description: string, short_description: string, technologies: string, image_url: string, demo_url: string, repository_url: string, is_published: number }>>}
   */
  preview: () => apiRequest('/projects/preview', { method: 'GET' }),

  /**
   * List catalog projects (Authenticated)
   * @param {Record<string, string|boolean>} [params]
   */
  list: (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest(`/projects${query}`, { method: 'GET' });
  },

  /**
   * Get project by ID (Authenticated)
   * @param {number|string} id
   */
  getById: (id) => apiRequest(`/projects/${id}`, { method: 'GET' }),

  /**
   * Create project (Admin only)
   * @param {object} projectData
   */
  create: (projectData) => apiRequest('/projects', { method: 'POST', body: projectData }),

  /**
   * Update project (Admin only)
   * @param {number|string} id
   * @param {object} projectData
   */
  update: (id, projectData) => apiRequest(`/projects/${id}`, { method: 'PUT', body: projectData }),

  /**
   * Delete project (Admin only)
   * @param {number|string} id
   */
  delete: (id) => apiRequest(`/projects/${id}`, { method: 'DELETE' }),
};

/**
 * Contact Inquiry Endpoints
 */
export const contactApi = {
  /**
   * Submit an inquiry (Public, automatically links user_id if token present)
   * @param {{ name: string, email: string, inquiry_type: string, message: string }} contactData
   * @returns {Promise<{ success: boolean, message: string, id: number, status: string, user_id: number|null }>}
   */
  submit: (contactData) => apiRequest('/contact', { method: 'POST', body: contactData }),

  /**
   * Retrieve all contact inquiries submitted by the authenticated user
   * @returns {Promise<Array<{ id: number, user_id: number, name: string, email: string, inquiry_type: string, message: string, status: string, response_message: string|null, responded_at: string|null, created_at: string }>>}
   */
  getMyInquiries: () => apiRequest('/contact/my-inquiries', { method: 'GET' }),
};

/**
 * Site Metrics Endpoints
 */
export const metricsApi = {
  /**
   * Atomically increment general site visit counter (Public)
   * @returns {Promise<{ success: boolean, count: number }>}
   */
  recordVisit: () => apiRequest('/metrics/visit', { method: 'POST' }),

  /**
   * Retrieve aggregated KPIs and analytics datasets (Admin only)
   */
  getMetrics: () => apiRequest('/metrics', { method: 'GET' }),
};

/**
 * Operator Endpoints (Operator/Admin only)
 */
export const operatorApi = {
  /**
   * List contact inquiries with optional status filter
   * @param {'pendiente'|'respondida'} [status]
   */
  getMessages: (status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/operator/messages${query}`, { method: 'GET' });
  },

  /**
   * Get inquiry by ID
   * @param {number|string} id
   */
  getMessageById: (id) => apiRequest(`/operator/messages/${id}`, { method: 'GET' }),

  /**
   * Send response to inquiry via email and mark as responded
   * @param {number|string} id
   * @param {string} response_message
   */
  respondMessage: (id, response_message) =>
    apiRequest(`/operator/messages/${id}/respond`, {
      method: 'POST',
      body: { response_message },
    }),
};

/**
 * Users Management Endpoints (Admin only)
 */
export const usersApi = {
  /**
   * List all registered users
   */
  list: () => apiRequest('/users', { method: 'GET' }),

  /**
   * Update user role
   * @param {number|string} id
   * @param {'usuario_normal'|'operador'|'administrador'} role
   */
  updateRole: (id, role) => apiRequest(`/users/${id}/role`, { method: 'PUT', body: { role } }),
};

export default {
  apiRequest,
  auth: authApi,
  services: servicesApi,
  projects: projectsApi,
  contact: contactApi,
  metrics: metricsApi,
  operator: operatorApi,
  users: usersApi,
};
