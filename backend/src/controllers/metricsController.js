// backend/src/controllers/metricsController.js
const { getDb } = require('../database/db');

/**
 * POST /api/metrics/visit
 * Public access: Atomically increments site_metrics.visitas_generales.
 */
function recordVisit(req, res, next) {
  try {
    const db = getDb();

    // Atomic increment of general visits counter
    db.prepare(`
      INSERT INTO site_metrics (metric_key, count, updated_at)
      VALUES ('visitas_generales', 1, CURRENT_TIMESTAMP)
      ON CONFLICT(metric_key) DO UPDATE SET
        count = site_metrics.count + 1,
        updated_at = CURRENT_TIMESTAMP
    `).run();

    const row = db.prepare(`
      SELECT count FROM site_metrics WHERE metric_key = 'visitas_generales'
    `).get();

    const count = row ? Number(row.count) : 1;

    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/metrics
 * Protected access: Requires role 'administrador'.
 * Aggregates KPI counters and Recharts datasets.
 */
function getMetrics(req, res, next) {
  try {
    const db = getDb();

    // 1. Site traffic and login counters
    const metricsRows = db.prepare('SELECT metric_key, count FROM site_metrics').all();
    const metricsMap = {};
    for (const row of metricsRows) {
      metricsMap[row.metric_key] = Number(row.count);
    }

    const visitas_generales = metricsMap['visitas_generales'] || 0;
    const accesos_autenticados = metricsMap['accesos_autenticados'] || 0;

    // 2. Aggregate counts from primary tables
    const usersRow = db.prepare('SELECT COUNT(*) AS count FROM users').get();
    const total_users = usersRow ? Number(usersRow.count) : 0;

    const projectsRow = db.prepare('SELECT COUNT(*) AS count FROM projects').get();
    const total_projects = projectsRow ? Number(projectsRow.count) : 0;

    const servicesRow = db.prepare('SELECT COUNT(*) AS count FROM services').get();
    const total_services = servicesRow ? Number(servicesRow.count) : 0;

    const messagesRow = db.prepare('SELECT COUNT(*) AS count FROM contact_messages').get();
    const total_messages = messagesRow ? Number(messagesRow.count) : 0;

    const pendingRow = db.prepare("SELECT COUNT(*) AS count FROM contact_messages WHERE status = 'pendiente'").get();
    const pending_messages = pendingRow ? Number(pendingRow.count) : 0;

    const respondedRow = db.prepare("SELECT COUNT(*) AS count FROM contact_messages WHERE status = 'respondida'").get();
    const responded_messages = respondedRow ? Number(respondedRow.count) : 0;

    // 3. Chart datasets for Recharts
    const inquiriesByType = db.prepare(`
      SELECT inquiry_type AS type, COUNT(*) AS count
      FROM contact_messages
      GROUP BY inquiry_type
      ORDER BY count DESC
    `).all();

    const registrationsTimeline = db.prepare(`
      SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS count
      FROM users
      GROUP BY substr(created_at, 1, 10)
      ORDER BY date ASC
    `).all();

    return res.status(200).json({
      visitas_generales,
      accesos_autenticados,
      total_users,
      total_projects,
      total_services,
      total_messages,
      pending_messages,
      responded_messages,
      inquiriesByType,
      registrationsTimeline,
      // Compatibility aliases for E2E tests and Recharts dashboards
      visits: visitas_generales,
      authenticated_logins: accesos_autenticados,
      inquiries_by_type: inquiriesByType,
      consultas_por_tipo: inquiriesByType,
      charts: {
        inquiriesByType,
        registrationsTimeline
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  recordVisit,
  getMetrics
};
