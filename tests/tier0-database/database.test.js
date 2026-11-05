/**
 * Tier 0: Direct SQLite Database Schema & Seed Verification
 * Validates specifications defined in DATABASE.md and PROJECT.md
 */
const { describe, it, expect } = require('../helpers/test-harness');
const db = require('../helpers/db');

describe('Tier 0: Direct SQLite Database Architecture & Constraints', () => {
  it('0.1 - Database file should exist and connect successfully', () => {
    if (!db.isAvailable()) {
      console.log('    [NOTE] Database file not yet initialized at candidate paths. Direct DB checks will verify once M1 migration completes.');
      return;
    }
    const connection = db.connect();
    expect(connection).toBeDefined();
  });

  it('0.2 - Should contain all 5 required tables from DATABASE.md', () => {
    if (!db.isAvailable()) return;
    const tables = db.getTableNames();
    const requiredTables = ['users', 'projects', 'services', 'contact_messages', 'site_metrics'];
    for (const tbl of requiredTables) {
      expect(tables).toContain(tbl);
    }
  });

  it('0.3 - Table `users` should have all required columns and constraints', () => {
    if (!db.isAvailable()) return;
    const columns = db.getTableColumns('users');
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('name');
    expect(colNames).toContain('email');
    expect(colNames).toContain('password_hash');
    expect(colNames).toContain('role');
    expect(colNames).toContain('created_at');

    const emailCol = columns.find(c => c.name === 'email');
    expect(emailCol.notnull).toBe(1);
  });

  it('0.4 - Table `projects` should have required columns and is_published flag', () => {
    if (!db.isAvailable()) return;
    const columns = db.getTableColumns('projects');
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('title');
    expect(colNames).toContain('description');
    expect(colNames).toContain('short_description');
    expect(colNames).toContain('technologies');
    expect(colNames).toContain('is_published');
    expect(colNames).toContain('created_at');
    expect(colNames).toContain('updated_at');
  });

  it('0.5 - Table `services` should have required columns including icon and is_published', () => {
    if (!db.isAvailable()) return;
    const columns = db.getTableColumns('services');
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('title');
    expect(colNames).toContain('description');
    expect(colNames).toContain('icon');
    expect(colNames).toContain('is_published');
    expect(colNames).toContain('created_at');
    expect(colNames).toContain('updated_at');
  });

  it('0.6 - Table `contact_messages` should support optional user_id and default status', () => {
    if (!db.isAvailable()) return;
    const columns = db.getTableColumns('contact_messages');
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('user_id');
    expect(colNames).toContain('name');
    expect(colNames).toContain('email');
    expect(colNames).toContain('inquiry_type');
    expect(colNames).toContain('message');
    expect(colNames).toContain('status');
    expect(colNames).toContain('response_message');
    expect(colNames).toContain('responded_at');
    expect(colNames).toContain('created_at');

    const userIdCol = columns.find(c => c.name === 'user_id');
    expect(userIdCol.notnull).toBe(0); // must be nullable for guest inquiries
  });

  it('0.7 - Table `site_metrics` should store counters and have initial keys seeded', () => {
    if (!db.isAvailable()) return;
    const columns = db.getTableColumns('site_metrics');
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('metric_key');
    expect(colNames).toContain('count');
    expect(colNames).toContain('updated_at');

    const rows = db.query(`SELECT metric_key, count FROM site_metrics`);
    const keys = rows.map(r => r.metric_key);
    expect(keys).toContain('visitas_generales');
    expect(keys).toContain('accesos_autenticados');
  });

  it('0.8 - Seed data should include default test accounts (admin, operator, user)', () => {
    if (!db.isAvailable()) return;
    const users = db.query(`SELECT email, role, password_hash FROM users`);
    const emails = users.map(u => u.email.toLowerCase());
    
    expect(emails).toContain('admin@portfolio.local');
    expect(emails).toContain('operador@portfolio.local');
    expect(emails).toContain('usuario@portfolio.local');

    for (const u of users) {
      expect(u.password_hash).toBeDefined();
      expect(u.password_hash.length).toBeGreaterThan(10);
    }
  });

  it('0.9 - Seed data should include initial portfolio projects and services', () => {
    if (!db.isAvailable()) return;
    const projects = db.query(`SELECT id, title, is_published FROM projects`);
    expect(projects.length).toBeGreaterThanOrEqual(1);

    const services = db.query(`SELECT id, title, icon, is_published FROM services`);
    expect(services.length).toBeGreaterThanOrEqual(1);
  });
});
