const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');

describe('GET /api/health', () => {
  it('should return 200 OK with json payload and ok status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.strictEqual(response.body.status, 'ok');
    assert.strictEqual(typeof response.body.timestamp, 'string');
    assert.ok(new Date(response.body.timestamp).getTime() > 0, 'timestamp must be a valid ISO string');
    assert.strictEqual(typeof response.body.uptime, 'number');
    assert.strictEqual(response.body.service, 'portfolio-backend');
  });

  it('should return 404 for unknown api routes', async () => {
    const response = await request(app)
      .get('/api/unknown-route-check')
      .expect(404);

    assert.strictEqual(response.body.error, 'Endpoint not found');
  });
});
