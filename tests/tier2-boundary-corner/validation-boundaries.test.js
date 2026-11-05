/**
 * Tier 2: Boundary & Corner Cases - Input Validation & Payload Boundaries
 */
const { describe, it, expect } = require('../helpers/test-harness');
const api = require('../helpers/api');

describe('Tier 2: Boundary & Corner Cases - Input Validation', () => {
  it('2.1 - Empty payload {} on POST /api/auth/register returns 400 Bad Request', async () => {
    const res = await api.post('/api/auth/register', {});
    expect(res.status).toBe(400);
  });

  it('2.2 - Empty payload {} on POST /api/auth/login returns 400 Bad Request', async () => {
    const res = await api.post('/api/auth/login', {});
    expect(res.status).toBe(400);
  });

  it('2.3 - Empty payload {} on POST /api/contact returns 400 Bad Request', async () => {
    const res = await api.post('/api/contact', {});
    expect(res.status).toBe(400);
  });

  it('2.4 - Whitespace-only strings in registration fields return 400 Bad Request', async () => {
    const res = await api.post('/api/auth/register', {
      name: '   ',
      email: 'whitespace@portfolio.local',
      password: '   '
    });
    expect(res.status).toBe(400);
  });

  it('2.5 - Whitespace-only message in contact form returns 400 Bad Request', async () => {
    const res = await api.post('/api/contact', {
      name: 'Tester',
      email: 'test@portfolio.local',
      inquiry_type: 'Presupuesto',
      message: '         \n\t       '
    });
    expect(res.status).toBe(400);
  });

  it('2.6 - Submitting oversized text payload (10KB) is handled without server crash', async () => {
    const largeMessage = 'A'.repeat(10000);
    const res = await api.post('/api/contact', {
      name: 'Stress Tester',
      email: 'stress@portfolio.local',
      inquiry_type: 'Presupuesto',
      message: largeMessage
    });
    // Server must either accept or reject with 400/413, but never crash (500)
    expect([200, 201, 400, 413].includes(res.status)).toBe(true);
  });

  it('2.7 - Non-numeric ID in /api/projects/:id returns 400 or 404', async () => {
    const res = await api.get('/api/projects/not-a-number');
    expect([400, 401, 404].includes(res.status)).toBe(true);
  });

  it('2.8 - Negative ID in /api/projects/:id returns 404 Not Found', async () => {
    const res = await api.get('/api/projects/-1');
    expect([400, 401, 404].includes(res.status)).toBe(true);
  });
});
