/**
 * Tier 1: Feature Coverage - Backend Health Check
 * Spec: ORIGINAL_REQUEST:29, SPEC:RF-13, PROJECT:Feature 1
 */
const { describe, it, expect } = require('../helpers/test-harness');
const api = require('../helpers/api');

describe('Tier 1: Feature Coverage - Health Check Endpoint', () => {
  it('1.1 - GET /api/health should respond with HTTP 200 OK', async () => {
    const res = await api.get('/api/health');
    expect(res.status).toBe(200);
  });

  it('1.2 - GET /api/health response body should contain status: "ok"', async () => {
    const res = await api.get('/api/health');
    expect(res.data).toBeDefined();
    expect(res.data.status).toBe('ok');
  });

  it('1.3 - GET /api/health response should contain a valid ISO timestamp', async () => {
    const res = await api.get('/api/health');
    expect(res.data.timestamp).toBeDefined();
    const parsedTime = Date.parse(res.data.timestamp);
    expect(Number.isNaN(parsedTime)).toBe(false);
  });

  it('1.4 - GET /api/health should return Content-Type: application/json', async () => {
    const res = await api.get('/api/health');
    const contentType = res.headers.get('content-type') || '';
    expect(contentType.includes('application/json')).toBe(true);
  });

  it('1.5 - GET /api/health response duration should be within local SLA (< 1000ms)', async () => {
    const res = await api.get('/api/health');
    expect(res.duration).toBeLessThan(1000);
  });

  it('1.6 - GET /api/nonexistent-route-xyz should return HTTP 404 Not Found', async () => {
    const res = await api.get('/api/nonexistent-route-xyz');
    expect(res.status).toBe(404);
  });
});
