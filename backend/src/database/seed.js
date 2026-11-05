// backend/src/database/seed.js
const bcrypt = require('bcryptjs');
const { getDb, closeDb } = require('./db');
const { migrateDatabase } = require('./migrate');

function seedDatabase() {
  console.log('[Database Seeder] Starting database seeding...');
  
  // Ensure schema exists first
  migrateDatabase();
  const db = getDb();

  // 1. Seed Users (3 Default Accounts with bcryptjs hash)
  console.log('[Database Seeder] Seeding users...');
  const usersToSeed = [
    {
      name: 'Administrador Principal',
      email: 'admin@portfolio.local',
      plainPassword: 'admin123',
      role: 'administrador'
    },
    {
      name: 'Operador de Soporte',
      email: 'operador@portfolio.local',
      plainPassword: 'operador123',
      role: 'operador'
    },
    {
      name: 'Usuario Demostración',
      email: 'usuario@portfolio.local',
      plainPassword: 'usuario123',
      role: 'usuario_normal'
    }
  ];

  const checkUserStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const insertUserStmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);

  for (const user of usersToSeed) {
    const existing = checkUserStmt.get(user.email);
    if (!existing) {
      const hash = bcrypt.hashSync(user.plainPassword, 10);
      insertUserStmt.run(user.name, user.email, hash, user.role);
      console.log(`  + Seeded user: ${user.email} (${user.role})`);
    } else {
      console.log(`  ~ User already exists: ${user.email}`);
    }
  }

  // Retrieve normal user ID for relational linkage
  const normalUser = checkUserStmt.get('usuario@portfolio.local');
  const normalUserId = normalUser ? normalUser.id : null;

  // 2. Seed Projects (4 Diverse Projects from Spec)
  console.log('[Database Seeder] Seeding projects...');
  const projectsToSeed = [
    {
      title: 'Plataforma E-Commerce Ether',
      short_description: 'Tienda online de alto rendimiento con carrito en tiempo real y pasarela de pagos.',
      description: 'Sistema de comercio electrónico fullstack con arquitectura desacoplada, gestión de inventario, pasarela de pagos integrada y panel de administración para control de pedidos en tiempo real.',
      technologies: JSON.stringify(['React', 'Node.js', 'Express', 'Tailwind CSS', 'SQLite']),
      image_url: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&auto=format&fit=crop&q=80',
      demo_url: 'https://demo-ecommerce.local',
      repository_url: 'https://github.com/developer/ether-ecommerce',
      is_published: 1
    },
    {
      title: 'Panel de Analíticas y Métricas en Tiempo Real',
      short_description: 'Dashboard ejecutivo con gráficos interactivos y telemetría de eventos.',
      description: 'Plataforma de visualización de datos de negocio construida con Recharts, procesamiento de series temporales, exportación de reportes PDF y autenticación multifactor.',
      technologies: JSON.stringify(['React', 'Recharts', 'Express', 'JWT', 'Tailwind CSS']),
      image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      demo_url: 'https://demo-analytics.local',
      repository_url: 'https://github.com/developer/realtime-dashboard',
      is_published: 1
    },
    {
      title: 'API RESTful de Microservicios & Autenticación',
      short_description: 'Motor backend modular con control de acceso basado en roles y rate limiting.',
      description: 'Servicio API robusto implementado en Node.js y Express con seguridad JWT, hash bcrypt, políticas de rate limiting, validaciones estrictas y documentación completa de endpoints.',
      technologies: JSON.stringify(['Node.js', 'Express', 'SQLite', 'bcrypt', 'JWT']),
      image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
      demo_url: 'https://api-docs.local',
      repository_url: 'https://github.com/developer/secure-api-gateway',
      is_published: 1
    },
    {
      title: 'Gestor de Tareas y Colaboración Ágil',
      short_description: 'Tablero Kanban interactivo con soporte de arrastrar y soltar y notificaciones.',
      description: 'Aplicación colaborativa para equipos de desarrollo ágil con tableros Kanban, seguimiento de hitos, filtros avanzados y mensajería interna.',
      technologies: JSON.stringify(['React', 'Vite', 'Tailwind CSS', 'Lucide React']),
      image_url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80',
      demo_url: 'https://kanban-demo.local',
      repository_url: 'https://github.com/developer/agile-task-manager',
      is_published: 1
    }
  ];

  const checkProjectStmt = db.prepare('SELECT id FROM projects WHERE title = ?');
  const insertProjectStmt = db.prepare(`
    INSERT INTO projects (title, description, short_description, technologies, image_url, demo_url, repository_url, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const proj of projectsToSeed) {
    if (!checkProjectStmt.get(proj.title)) {
      insertProjectStmt.run(
        proj.title,
        proj.description,
        proj.short_description,
        proj.technologies,
        proj.image_url,
        proj.demo_url,
        proj.repository_url,
        proj.is_published
      );
      console.log(`  + Seeded project: ${proj.title}`);
    } else {
      console.log(`  ~ Project already exists: ${proj.title}`);
    }
  }

  // 3. Seed Services (4 Services with Lucide Icon References)
  console.log('[Database Seeder] Seeding services...');
  const servicesToSeed = [
    {
      title: 'Desarrollo Fullstack Moderno',
      description: 'Arquitectura y desarrollo de aplicaciones web de extremo a extremo utilizando React, Vite, Node.js y bases de datos relacionales optimizadas.',
      icon: 'Code',
      is_published: 1
    },
    {
      title: 'Diseño y Construcción de APIs REST',
      description: 'Creación de interfaces de programación seguras, escalables y documentadas, con autenticación robusta mediante JWT y control de acceso por roles.',
      icon: 'Server',
      is_published: 1
    },
    {
      title: 'Arquitectura y Optimización de Bases de Datos',
      description: 'Modelado de esquemas relacionales, indexación de alto rendimiento, integridad referencial y consultas analíticas avanzadas.',
      icon: 'Database',
      is_published: 1
    },
    {
      title: 'Diseño de Interfaces UI/UX con Tailwind CSS',
      description: 'Construcción de sistemas de diseño consistentes, accesibles y totalmente responsivos, inspirados en estándares de alto impacto como Ether.',
      icon: 'Layout',
      is_published: 1
    }
  ];

  const checkServiceStmt = db.prepare('SELECT id FROM services WHERE title = ?');
  const insertServiceStmt = db.prepare(`
    INSERT INTO services (title, description, icon, is_published)
    VALUES (?, ?, ?, ?)
  `);

  for (const srv of servicesToSeed) {
    if (!checkServiceStmt.get(srv.title)) {
      insertServiceStmt.run(srv.title, srv.description, srv.icon, srv.is_published);
      console.log(`  + Seeded service: ${srv.title} (icon: ${srv.icon})`);
    } else {
      console.log(`  ~ Service already exists: ${srv.title}`);
    }
  }

  // 4. Seed Contact Messages (5 Realistic Messages across categories)
  console.log('[Database Seeder] Seeding contact messages...');
  const messagesToSeed = [
    {
      user_id: normalUserId,
      name: 'Lucas Martínez',
      email: 'lucas@techcompany.com',
      inquiry_type: 'Presupuesto',
      message: 'Hola, nos gustaría solicitar una cotización para el desarrollo de un panel administrativo similar al de su portfolio.',
      status: 'respondida',
      response_message: 'Estimado Lucas, un gusto saludarte. Te adjuntamos la propuesta técnica y costos estimados para coordinar una reunión.',
      responded_at: '2026-10-25 14:30:00'
    },
    {
      user_id: null,
      name: 'Sofía Benítez',
      email: 'sofia.benitez@agency.org',
      inquiry_type: 'Propuesta laboral',
      message: 'Estimado/a, estamos en búsqueda de un desarrollador Fullstack con perfil proactivo para liderar proyectos en React y Express. ¿Podríamos coordinar una entrevista?',
      status: 'pendiente',
      response_message: null,
      responded_at: null
    },
    {
      user_id: null,
      name: 'Martín Gutiérrez',
      email: 'martin@cloudsolutions.io',
      inquiry_type: 'Consulta técnica',
      message: 'Excelente portfolio. ¿Qué estrategia de caché recomiendan para optimizar las consultas analíticas en SQLite?',
      status: 'respondida',
      response_message: 'Hola Martín, implementamos índices B-Tree específicos y contadores en la tabla site_metrics para evitar agregaciones pesadas en runtime.',
      responded_at: '2026-10-28 09:15:00'
    },
    {
      user_id: normalUserId,
      name: 'Camila Rojas',
      email: 'camila.rojas@startup.dev',
      inquiry_type: 'Colaboración',
      message: 'Hola, nos encantaría evaluar una alianza técnica para integrar servicios de análisis de datos en nuestra aplicación.',
      status: 'pendiente',
      response_message: null,
      responded_at: null
    },
    {
      user_id: null,
      name: 'Gonzalo Álvarez',
      email: 'gonzalo@enterprise.net',
      inquiry_type: 'Presupuesto',
      message: 'Buenas tardes, requerimos una auditoría de rendimiento y optimización para una API existente. ¿Tienen disponibilidad este mes?',
      status: 'pendiente',
      response_message: null,
      responded_at: null
    }
  ];

  const checkMessageStmt = db.prepare('SELECT id FROM contact_messages WHERE email = ? AND message = ?');
  const insertMessageStmt = db.prepare(`
    INSERT INTO contact_messages (user_id, name, email, inquiry_type, message, status, response_message, responded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const msg of messagesToSeed) {
    if (!checkMessageStmt.get(msg.email, msg.message)) {
      insertMessageStmt.run(
        msg.user_id,
        msg.name,
        msg.email,
        msg.inquiry_type,
        msg.message,
        msg.status,
        msg.response_message,
        msg.responded_at
      );
      console.log(`  + Seeded message from: ${msg.name} [${msg.inquiry_type} - ${msg.status}]`);
    } else {
      console.log(`  ~ Message already exists from: ${msg.name}`);
    }
  }

  // 5. Seed Site Metrics (Baseline Counters starting at 0)
  console.log('[Database Seeder] Seeding site metrics...');
  const metricsToSeed = [
    { key: 'visitas_generales', count: 0 },
    { key: 'accesos_autenticados', count: 0 }
  ];

  const insertMetricStmt = db.prepare(`
    INSERT INTO site_metrics (metric_key, count, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(metric_key) DO UPDATE SET
      count = CASE WHEN site_metrics.count = 0 THEN excluded.count ELSE site_metrics.count END
  `);

  for (const metric of metricsToSeed) {
    insertMetricStmt.run(metric.key, metric.count);
    console.log(`  + Initialized metric: ${metric.key} -> count=${metric.count}`);
  }

  console.log('[Database Seeder] Seeding completed successfully.');
}

if (require.main === module) {
  try {
    seedDatabase();
    closeDb();
    process.exit(0);
  } catch (err) {
    console.error('[Database Seeder Error]', err);
    closeDb();
    process.exit(1);
  }
}

module.exports = { seedDatabase };
