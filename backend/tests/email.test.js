// backend/tests/email.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const emailService = require('../src/services/emailService');

describe('Email Service Fallback & Graceful Degradation', () => {
  it('sendInquiryResponse falls back cleanly without throwing when SMTP is unconfigured', async () => {
    const origHost = process.env.SMTP_HOST;
    process.env.SMTP_HOST = 'dummy';

    const result = await emailService.sendInquiryResponse({
      to: 'client@test.local',
      name: 'Client Test',
      originalMessage: 'Need information on fullstack services',
      responseMessage: 'Thank you for your inquiry. We will contact you soon.'
    });

    assert.ok(result);
    assert.strictEqual(result.fallback, true);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.delivered, false);

    process.env.SMTP_HOST = origHost || '';
  });

  it('sendInquiryResponse validates required fields without throwing', async () => {
    const result = await emailService.sendInquiryResponse({
      to: '',
      responseMessage: ''
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.fallback, true);
  });
});
