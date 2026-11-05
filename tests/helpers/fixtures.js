/**
 * Test Fixture Generators
 */
const config = require('./config');

function randomId(prefix = 't') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function randomEmail(prefix = 'user') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@portfolio.local`;
}

function makeUser(overrides = {}) {
  const id = randomId('usr');
  return {
    name: `Test User ${id}`,
    email: randomEmail('usr'),
    password: 'TestPassword123!',
    ...overrides
  };
}

function makeInquiry(overrides = {}) {
  const id = randomId('inq');
  return {
    name: `Inquirer ${id}`,
    email: randomEmail('inq'),
    inquiry_type: 'Presupuesto',
    message: `Hola, esta es una consulta automatizada de prueba ${id} para validar el flujo del formulario.`,
    ...overrides
  };
}

function makeProject(overrides = {}) {
  const id = randomId('prj');
  return {
    title: `Proyecto Test ${id}`,
    description: `Descripción detallada y completa del proyecto automatizado ${id} para verificación E2E.`,
    short_description: `Resumen de proyecto ${id}`,
    technologies: 'React, Express, SQLite, Tailwind CSS',
    image_url: `/assets/projects/${id}.webp`,
    demo_url: `https://demo-${id}.local`,
    repository_url: `https://github.com/developer/${id}`,
    is_published: 1,
    ...overrides
  };
}

function makeService(overrides = {}) {
  const id = randomId('srv');
  return {
    title: `Servicio Especializado ${id}`,
    description: `Descripción del servicio técnico de alta disponibilidad y arquitectura escalable ${id}.`,
    icon: 'Code',
    is_published: 1,
    ...overrides
  };
}

module.exports = {
  randomId,
  randomEmail,
  makeUser,
  makeInquiry,
  makeProject,
  makeService,
  defaultCredentials: config.defaultCredentials
};
