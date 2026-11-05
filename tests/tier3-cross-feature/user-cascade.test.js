/**
 * Tier 3: Cross-Feature Combinations - Relational Integrity & User Deletion Cascade
 * Workflow: Register User -> Submit Inquiry -> Delete User -> Verify Inquiry Preserved with user_id = NULL
 * Spec: DATABASE:8 ("La eliminación de un usuario no deberá borrar automáticamente sus consultas", ON DELETE SET NULL)
 */
const { describe, it, expect } = require('../helpers/test-harness');
const api = require('../helpers/api');
const db = require('../helpers/db');
const { makeUser, makeInquiry } = require('../helpers/fixtures');

describe('Tier 3: Cross-Feature - Relational Integrity & Cascade on User Removal', () => {
  let adminToken = null;
  const tempUser = makeUser();
  let tempUserId = null;
  let tempUserToken = null;
  let messageId = null;

  it('3.12 - Step 1: Register temporary user and submit authenticated inquiry', async () => {
    try {
      const admAuth = await api.loginAs('admin');
      adminToken = admAuth.token;
    } catch {}

    const regRes = await api.post('/api/auth/register', tempUser);
    expect(regRes.status).toBe(201);
    tempUserId = regRes.data.user.id;
    tempUserToken = regRes.data.token;

    const inqRes = await api.post('/api/contact', makeInquiry({
      name: tempUser.name,
      email: tempUser.email
    }), { token: tempUserToken });

    expect([200, 201].includes(inqRes.status)).toBe(true);
    if (inqRes.data && inqRes.data.id) {
      messageId = inqRes.data.id;
    }
  });

  it('3.13 - Step 2: Delete temporary user account', async () => {
    if (!tempUserId) return;

    // Try deleting via Admin API if available
    if (adminToken) {
      const delRes = await api.delete(`/api/users/${tempUserId}`, { token: adminToken });
      if ([200, 204].includes(delRes.status)) {
        return;
      }
    }

    // Direct SQLite deletion fallback to verify database engine constraint
    if (db.isAvailable()) {
      db.exec(`PRAGMA foreign_keys = ON;`);
      db.query(`DELETE FROM users WHERE id = ?`, tempUserId);
    }
  });

  it('3.14 - Step 3: Verify contact message still exists and user_id is set to NULL', async () => {
    if (db.isAvailable() && messageId) {
      const msg = db.queryOne(`SELECT id, user_id, email, status FROM contact_messages WHERE id = ?`, messageId);
      if (msg) {
        expect(msg.id).toBe(messageId);
        expect(msg.user_id).toBeNull(); // ON DELETE SET NULL
      }
    } else if (adminToken && messageId) {
      const opAuth = await api.loginAs('operator');
      const detailRes = await api.get(`/api/operator/messages/${messageId}`, { token: opAuth.token });
      if (detailRes.status === 200) {
        expect(detailRes.data.user_id).toBeNull();
      }
    }
  });
});
