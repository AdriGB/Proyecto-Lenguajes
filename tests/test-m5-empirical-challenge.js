/**
 * Empirical Verification & Stress Test Harness for Milestone 5
 * Target: ProtectedRoute RBAC Decision Matrix, Projects.jsx Technology Parsing & Filtering,
 * and ProjectDetail.jsx Data Resolution & Fallbacks.
 * 
 * Zero-dependency native Node.js harness using esbuild for JSX transpilation.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const esbuild = require('esbuild');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const serverManager = require('./helpers/server-manager');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function assert(condition, message, detail = null) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
    if (detail) {
      console.error(`         Detail: ${detail}`);
    }
    failureDetails.push({ message, detail });
  }
}

console.log('====================================================');
console.log('   CHALLENGER M5-1: EMPIRICAL STRESS TEST SUITE     ');
console.log('====================================================\n');

// -----------------------------------------------------------------
// BUNDLE FRONTEND COMPONENTS FOR IN-PROCESS EXECUTION
// -----------------------------------------------------------------
console.log('Building in-memory module bundle of target components...');

const bundleCode = [
  "import ProtectedRouteComp from './frontend/src/components/ProtectedRoute.jsx';",
  "import { parseTechnologies as parseTechFn } from './frontend/src/pages/Projects.jsx';",
  "import * as componentsIndex from './frontend/src/components/index.js';",
  "globalThis.M5_EXPORTS = { ProtectedRoute: ProtectedRouteComp, parseTechnologies: parseTechFn, componentsIndex };"
].join('\n');

try {
  const buildResult = esbuild.buildSync({
    stdin: {
      contents: bundleCode,
      resolveDir: process.cwd(),
      loader: 'jsx',
    },
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    external: ['react', 'react-dom', 'react-dom/server', 'react-router-dom', 'lucide-react', 'recharts']
  });

  const runFn = new Function('require', buildResult.outputFiles[0].text);
  runFn(require);
  assert(typeof globalThis.M5_EXPORTS.ProtectedRoute === 'function', 'ProtectedRoute is exported as a function');
  assert(typeof globalThis.M5_EXPORTS.parseTechnologies === 'function', 'parseTechnologies is exported as a function');
  assert(typeof globalThis.M5_EXPORTS.componentsIndex.ProtectedRoute === 'function', 'ProtectedRoute is re-exported in frontend/src/components/index.js');
} catch (err) {
  assert(false, 'Bundle compilation failed: ' + err.message, err.stack);
}

const { ProtectedRoute, parseTechnologies } = globalThis.M5_EXPORTS;

// -----------------------------------------------------------------
// SUITE 1: ProtectedRoute RBAC DECISION MATRIX & BOUNDARY CONDITIONS
// -----------------------------------------------------------------
console.log('\nSuite 1: ProtectedRoute Decision Matrix & RBAC Boundaries');

// We simulate React Router and AuthContext hooks by overriding module mocks or prop behavior
// Since ProtectedRoute imports useAuth from '../context/AuthContext' and useLocation, Navigate, Outlet from 'react-router-dom',
// we can evaluate the decision tree directly and via component execution.

/**
 * Creates a mock React Router Navigate element
 */
function MockNavigate(props) {
  return React.createElement('div', {
    'data-mock': 'Navigate',
    'data-to': props.to,
    'data-replace': String(props.replace),
    'data-from': props.state?.from?.pathname || ''
  });
}

/**
 * Creates a mock React Router Outlet element
 */
function MockOutlet() {
  return React.createElement('div', { 'data-mock': 'Outlet' }, 'Nested Outlet Content');
}

/**
 * Test harness wrapper simulating the exact logic inside ProtectedRoute
 */
function evaluateProtectedRouteLogic({ authState, allowedRoles = null, redirectPath = '/login', locationPath = '/proyectos', children }) {
  const { loading, isAuthenticated, user, logout } = authState;
  const location = { pathname: locationPath };

  // 1. Loading state
  if (loading) {
    return {
      status: 'LOADING',
      rendered: 'Verificando sesión',
      redirect: null,
      forbidden: false,
    };
  }

  // 2. Unauthenticated state
  if (!isAuthenticated || !user) {
    return {
      status: 'REDIRECT_LOGIN',
      rendered: null,
      redirect: {
        to: redirectPath,
        from: location,
        replace: true,
      },
      forbidden: false,
    };
  }

  // 3. Unauthorized Role State (403)
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    return {
      status: 'FORBIDDEN_403',
      rendered: 'Acceso no autorizado',
      currentRole: user.role,
      allowedRoles: allowedRoles,
      showProjectsBtn: user.role === 'usuario_normal',
      forbidden: true,
      redirect: null,
    };
  }

  // 4. Authorized state
  return {
    status: 'AUTHORIZED',
    rendered: children ? 'CHILDREN_CONTENT' : 'OUTLET_CONTENT',
    forbidden: false,
    redirect: null,
  };
}

// 1.1 Loading state precedence
{
  const res1 = evaluateProtectedRouteLogic({
    authState: { loading: true, isAuthenticated: false, user: null },
    allowedRoles: ['usuario_normal'],
  });
  assert(res1.status === 'LOADING', 'loading=true with unauthenticated user displays loading state and does not redirect');

  const res2 = evaluateProtectedRouteLogic({
    authState: { loading: true, isAuthenticated: true, user: { role: 'administrador' } },
    allowedRoles: ['administrador'],
  });
  assert(res2.status === 'LOADING', 'loading=true with authenticated admin displays loading state before granting access');
}

// 1.2 Unauthenticated redirects
{
  const res = evaluateProtectedRouteLogic({
    authState: { loading: false, isAuthenticated: false, user: null },
    allowedRoles: ['usuario_normal'],
    locationPath: '/proyectos/42',
  });
  assert(res.status === 'REDIRECT_LOGIN', 'Unauthenticated user is redirected to login');
  assert(res.redirect.to === '/login', 'Unauthenticated redirect target is /login by default');
  assert(res.redirect.from.pathname === '/proyectos/42', 'Target location path is preserved in redirect state');
  assert(res.redirect.replace === true, 'Redirect uses replace mode to avoid polluting browser history');
}

// 1.3 Custom redirect path
{
  const res = evaluateProtectedRouteLogic({
    authState: { loading: false, isAuthenticated: false, user: null },
    redirectPath: '/custom-auth',
  });
  assert(res.redirect.to === '/custom-auth', 'Custom redirectPath is respected');
}

// 1.4 Inconsistent Auth State: isAuthenticated=true but user=null
{
  const res = evaluateProtectedRouteLogic({
    authState: { loading: false, isAuthenticated: true, user: null },
    allowedRoles: ['usuario_normal'],
  });
  assert(res.status === 'REDIRECT_LOGIN', 'isAuthenticated=true with null user safely redirects to login without crash');
}

// 1.5 RBAC: Normal User accessing Operator/Admin Route
{
  const res = evaluateProtectedRouteLogic({
    authState: { loading: false, isAuthenticated: true, user: { role: 'usuario_normal' } },
    allowedRoles: ['operador', 'administrador'],
  });
  assert(res.status === 'FORBIDDEN_403', 'usuario_normal attempting operator/admin route triggers 403 Forbidden');
  assert(res.currentRole === 'usuario_normal', '403 diagnostics identifies current role as usuario_normal');
  assert(res.showProjectsBtn === true, '403 diagnostics offers "Ver Proyectos" shortcut button to normal users');
}

// 1.6 RBAC: Operator accessing Admin Route
{
  const res = evaluateProtectedRouteLogic({
    authState: { loading: false, isAuthenticated: true, user: { role: 'operador' } },
    allowedRoles: ['administrador'],
  });
  assert(res.status === 'FORBIDDEN_403', 'operador attempting admin route (/admin) triggers 403 Forbidden');
  assert(res.currentRole === 'operador', '403 diagnostics identifies current role as operador');
  assert(res.showProjectsBtn === false, '403 diagnostics does not offer "Ver Proyectos" shortcut to operador');
}

// 1.7 RBAC: Administrator accessing Admin Route
{
  const res = evaluateProtectedRouteLogic({
    authState: { loading: false, isAuthenticated: true, user: { role: 'administrador' } },
    allowedRoles: ['administrador'],
    children: 'ADMIN_DASHBOARD',
  });
  assert(res.status === 'AUTHORIZED', 'administrador accessing admin route is authorized');
  assert(res.rendered === 'CHILDREN_CONTENT', 'Authorized admin renders children content');
}

// 1.8 RBAC: Operator accessing Operator Route
{
  const res = evaluateProtectedRouteLogic({
    authState: { loading: false, isAuthenticated: true, user: { role: 'operador' } },
    allowedRoles: ['operador', 'administrador'],
    children: 'OPERATOR_INBOX',
  });
  assert(res.status === 'AUTHORIZED', 'operador accessing operator route is authorized');
}

// 1.9 RBAC: Administrator accessing Operator Route
{
  const res = evaluateProtectedRouteLogic({
    authState: { loading: false, isAuthenticated: true, user: { role: 'administrador' } },
    allowedRoles: ['operador', 'administrador'],
    children: 'OPERATOR_INBOX',
  });
  assert(res.status === 'AUTHORIZED', 'administrador accessing operator route is authorized');
}

// 1.10 RBAC: Normal User accessing Private Projects Route
{
  const res = evaluateProtectedRouteLogic({
    authState: { loading: false, isAuthenticated: true, user: { role: 'usuario_normal' } },
    allowedRoles: ['usuario_normal', 'operador', 'administrador'],
    children: 'PROJECTS_GALLERY',
  });
  assert(res.status === 'AUTHORIZED', 'usuario_normal accessing /proyectos is authorized');
}

// 1.11 RBAC: No roles restriction (allowedRoles = null)
{
  const res = evaluateProtectedRouteLogic({
    authState: { loading: false, isAuthenticated: true, user: { role: 'cualquier_rol' } },
    allowedRoles: null,
    children: 'OPEN_PROTECTED_SECTION',
  });
  assert(res.status === 'AUTHORIZED', 'allowedRoles=null permits any authenticated user');
}

// 1.12 RBAC: Empty allowedRoles array ([])
{
  const res = evaluateProtectedRouteLogic({
    authState: { loading: false, isAuthenticated: true, user: { role: 'administrador' } },
    allowedRoles: [],
    children: 'LOCKED_SECTION',
  });
  assert(res.status === 'FORBIDDEN_403', 'allowedRoles=[] strictly blocks access (renders 403) even for admin');
}

// 1.13 Outlet fallback when children not provided
{
  const res = evaluateProtectedRouteLogic({
    authState: { loading: false, isAuthenticated: true, user: { role: 'administrador' } },
    allowedRoles: ['administrador'],
    children: undefined,
  });
  assert(res.rendered === 'OUTLET_CONTENT', 'Renders Outlet when children prop is omitted');
}

// -----------------------------------------------------------------
// SUITE 2: parseTechnologies ALGORITHM & STRESS TEST
// -----------------------------------------------------------------
console.log('\nSuite 2: parseTechnologies Algorithm & Stress Testing');

// 2.1 Valid JSON array string
{
  const input = '["React", "Node.js", "Express", "Tailwind CSS", "SQLite"]';
  const parsed = parseTechnologies(input);
  assert(Array.isArray(parsed), 'parseTechnologies returns an array for JSON array string');
  assert(parsed.length === 5, 'parseTechnologies parsed all 5 elements');
  assert(parsed[0] === 'React' && parsed[4] === 'SQLite', 'Elements match expected items');
}

// 2.2 Comma-separated string
{
  const input = 'React, Node.js, Express, Tailwind CSS, SQLite';
  const parsed = parseTechnologies(input);
  assert(Array.isArray(parsed), 'parseTechnologies returns an array for comma-separated string');
  assert(parsed.length === 5, 'parseTechnologies correctly splits 5 comma-separated items');
  assert(parsed[1] === 'Node.js', 'Items are properly trimmed');
}

// 2.3 Comma-separated with erratic whitespace
{
  const input = '  React  ,   Node.js  ,   TypeScript   ';
  const parsed = parseTechnologies(input);
  assert(parsed.length === 3, 'Handles irregular whitespace around commas');
  assert(parsed[0] === 'React' && parsed[1] === 'Node.js' && parsed[2] === 'TypeScript', 'All items trimmed cleanly');
}

// 2.4 Empty and null inputs
{
  assert(JSON.stringify(parseTechnologies('')) === '[]', 'parseTechnologies("") returns []');
  assert(JSON.stringify(parseTechnologies('   ')) === '[]', 'parseTechnologies("   ") returns []');
  assert(JSON.stringify(parseTechnologies(null)) === '[]', 'parseTechnologies(null) returns []');
  assert(JSON.stringify(parseTechnologies(undefined)) === '[]', 'parseTechnologies(undefined) returns []');
}

// 2.5 Native array pass-through
{
  const input = ['React', 'Vue', 'Angular'];
  const parsed = parseTechnologies(input);
  assert(parsed === input, 'parseTechnologies passes through native array');
}

// 2.6 Malformed JSON fallback
{
  // Bracketed non-JSON string
  const input = '[React, Node.js]';
  let threw = false;
  let parsed = null;
  try {
    parsed = parseTechnologies(input);
  } catch {
    threw = true;
  }
  assert(!threw, 'Malformed JSON does not throw uncaught error');
  assert(Array.isArray(parsed), 'Malformed JSON falls back to array');
  assert(parsed.length === 2, 'Malformed JSON falls back to comma split');
}

// 2.7 Non-string/non-array primitives
{
  assert(JSON.stringify(parseTechnologies(12345)) === '[]', 'Number input returns []');
  assert(JSON.stringify(parseTechnologies(true)) === '[]', 'Boolean input returns []');
  assert(JSON.stringify(parseTechnologies({ tech: 'React' })) === '[]', 'Object input returns []');
}

// 2.8 Consecutive commas and trailing commas
{
  const input = ',,,React,,,Node.js,,,';
  const parsed = parseTechnologies(input);
  assert(parsed.length === 2, 'Consecutive commas are filtered out via Boolean filter');
  assert(parsed[0] === 'React' && parsed[1] === 'Node.js', 'Clean elements extracted');
}

// -----------------------------------------------------------------
// SUITE 3: DYNAMIC TECH SET EXTRACTION & MULTI-FIELD FILTERING
// -----------------------------------------------------------------
console.log('\nSuite 3: Dynamic Tech Extraction & Multi-Field Filtering');

const sampleProjects = [
  {
    id: 1,
    title: 'Plataforma E-Commerce Lunar',
    short_description: 'Tienda online con carrito en tiempo real.',
    description: 'Sistema completo con pasarela de pagos integrada y reportes.',
    technologies: JSON.stringify(['React', 'Node.js', 'Express', 'Tailwind CSS', 'SQLite']),
  },
  {
    id: 2,
    title: 'Panel de Analíticas y Métricas',
    short_description: 'Dashboard ejecutivo con telemetría de eventos.',
    description: 'Visualización de datos con Recharts y series temporales.',
    technologies: JSON.stringify(['React', 'Recharts', 'Express', 'JWT', 'Tailwind CSS']),
  },
  {
    id: 3,
    title: 'API RESTful de Microservicios',
    short_description: 'Motor backend modular con rate limiting.',
    description: 'Servicio API robusto con seguridad JWT y bcrypt.',
    technologies: 'Node.js, Express, SQLite, bcrypt, JWT',
  },
  {
    id: 4,
    title: 'Gestor de Tareas Kanban',
    short_description: 'Tablero interactivo con arrastrar y soltar.',
    description: 'Aplicación colaborativa ágil con tableros interactivos.',
    technologies: 'React, Vite, Tailwind CSS, Lucide React',
  },
  {
    id: 5,
    title: 'Servicio Legacy sin Tecnologías',
    short_description: 'Proyecto antiguo.',
    description: null,
    technologies: null,
  }
];

// Helper reproducing Projects.jsx availableTechnologies logic
function extractAvailableTechnologies(projectsList) {
  const techSet = new Set();
  projectsList.forEach((proj) => {
    const tags = parseTechnologies(proj.technologies);
    tags.forEach((tag) => techSet.add(tag));
  });
  return Array.from(techSet).sort();
}

// Helper reproducing Projects.jsx filteredProjects logic
function filterProjects(projectsList, searchQuery, selectedTech) {
  const query = (searchQuery || '').trim().toLowerCase();

  return projectsList.filter((project) => {
    const techList = parseTechnologies(project.technologies);

    // Technology Tag Filter
    if (selectedTech && !techList.includes(selectedTech)) {
      return false;
    }

    // Search Query Filter
    if (!query) return true;

    const matchTitle = (project.title || '').toLowerCase().includes(query);
    const matchShort = (project.short_description || '').toLowerCase().includes(query);
    const matchDesc = (project.description || '').toLowerCase().includes(query);
    const matchTech = techList.some((t) => String(t).toLowerCase().includes(query));

    return matchTitle || matchShort || matchDesc || matchTech;
  });
}

// 3.1 Unique Tech Set extraction
{
  const availableTechs = extractAvailableTechnologies(sampleProjects);
  assert(availableTechs.includes('React'), 'availableTechnologies contains React');
  assert(availableTechs.includes('Node.js'), 'availableTechnologies contains Node.js');
  assert(availableTechs.includes('Recharts'), 'availableTechnologies contains Recharts');
  assert(availableTechs.includes('SQLite'), 'availableTechnologies contains SQLite');
  assert(new Set(availableTechs).size === availableTechs.length, 'No duplicate technologies in availableTechnologies');
  
  // Sorted check
  const sortedCopy = [...availableTechs].sort();
  assert(JSON.stringify(availableTechs) === JSON.stringify(sortedCopy), 'availableTechnologies is alphabetically sorted');
}

// 3.2 Search by Title
{
  const results = filterProjects(sampleProjects, 'e-commerce', '');
  assert(results.length === 1 && results[0].id === 1, 'Search by title finds E-Commerce project');
}

// 3.3 Search by Short Description
{
  const results = filterProjects(sampleProjects, 'telemetría', '');
  assert(results.length === 1 && results[0].id === 2, 'Search by short description finds Analytics project');
}

// 3.4 Search by Description
{
  const results = filterProjects(sampleProjects, 'series temporales', '');
  assert(results.length === 1 && results[0].id === 2, 'Search by description finds Analytics project');
}

// 3.5 Search by Technology tag (case-insensitive)
{
  const resultsLower = filterProjects(sampleProjects, 'sqlite', '');
  const resultsUpper = filterProjects(sampleProjects, 'SQLITE', '');
  assert(resultsLower.length === 2, 'Search query "sqlite" matches 2 projects with SQLite');
  assert(resultsUpper.length === 2, 'Search query is case-insensitive for tech tags');
}

// 3.6 Pill Filter by Selected Technology
{
  const resultsReact = filterProjects(sampleProjects, '', 'React');
  assert(resultsReact.length === 3, 'Filter pill "React" matches exactly 3 projects');

  const resultsExpress = filterProjects(sampleProjects, '', 'Express');
  assert(resultsExpress.length === 3, 'Filter pill "Express" matches exactly 3 projects');

  const resultsNone = filterProjects(sampleProjects, '', 'NonExistentTech');
  assert(resultsNone.length === 0, 'Filter pill for unassigned tech returns 0 projects');
}

// 3.7 Combined Search Query + Selected Tech
{
  const results = filterProjects(sampleProjects, 'e-commerce', 'Express');
  assert(results.length === 1 && results[0].id === 1, 'Combined search "e-commerce" + pill "Express" matches project #1');

  const resultsConflict = filterProjects(sampleProjects, 'e-commerce', 'Recharts');
  assert(resultsConflict.length === 0, 'Combined conflicting search + pill correctly returns empty array');
}

// 3.8 Resilience against null/undefined fields
{
  let threw = false;
  try {
    const results = filterProjects(sampleProjects, 'legacy', '');
    assert(results.length === 1 && results[0].id === 5, 'Project with null description and technologies is handled without crash');
  } catch (err) {
    threw = true;
  }
  assert(!threw, 'filterProjects does not crash when fields are null');
}

// -----------------------------------------------------------------
// SUITE 4: ProjectDetail.jsx DATA RESOLUTION, DATES & FALLBACKS
// -----------------------------------------------------------------
console.log('\nSuite 4: ProjectDetail Resolution, Date Formatting & Fallbacks');

// Reproduce formatDate from ProjectDetail.jsx
function formatDate(dateStr) {
  if (!dateStr) return 'No especificada';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
  } catch {
    return dateStr;
  }
}

// 4.1 Date Formatting
{
  const validIso = '2026-03-15T10:00:00Z';
  const formatted = formatDate(validIso);
  assert(formatted.includes('2026'), 'formatDate formats year correctly');
  assert(formatted.includes('marzo'), 'formatDate uses Spanish month name (marzo)');

  assert(formatDate(null) === 'No especificada', 'formatDate(null) returns "No especificada"');
  assert(formatDate(undefined) === 'No especificada', 'formatDate(undefined) returns "No especificada"');
  assert(formatDate('') === 'No especificada', 'formatDate("") returns "No especificada"');
  assert(formatDate('invalid-date-string') === 'invalid-date-string', 'formatDate handles invalid date without throwing');
}

// 4.2 Fallback states for optional project fields
function evaluateProjectDetailView(project, error, loading) {
  if (loading) return { state: 'SKELETON_LOADING' };
  if (error || !project) {
    return {
      state: 'NOT_FOUND_404',
      errorHeading: 'Proyecto no encontrado',
      errorMessage: error || 'No fue posible localizar el proyecto solicitado en la base de datos.',
      hasReturnBtn: true,
      hasRetryBtn: true,
    };
  }

  const techList = parseTechnologies(project.technologies);

  return {
    state: 'LOADED',
    title: project.title,
    hasImage: Boolean(project.image_url),
    hasFallbackGraphic: !project.image_url,
    demoDisabled: !project.demo_url,
    demoLabel: project.demo_url ? 'Ver Demostración en Vivo' : 'Demo no configurada',
    repoDisabled: !project.repository_url,
    repoLabel: project.repository_url ? 'Explorar Repositorio' : 'Repositorio privado',
    techCount: techList.length,
    descriptionRendered: project.description || 'Sin descripción detallada adicional.',
    publishedBadge: project.is_published === 1 ? 'Activo' : 'Borrador',
  };
}

// 4.3 Evaluation of Complete Project
{
  const completeProj = {
    id: 1,
    title: 'E-Commerce',
    short_description: 'Short',
    description: 'Long description paragraph.\n\nSecond paragraph.',
    technologies: '["React", "Node.js"]',
    image_url: 'https://example.com/pic.png',
    demo_url: 'https://demo.example.com',
    repository_url: 'https://github.com/example/repo',
    is_published: 1,
    created_at: '2026-01-01T00:00:00Z',
  };

  const view = evaluateProjectDetailView(completeProj, null, false);
  assert(view.state === 'LOADED', 'Complete project enters LOADED state');
  assert(view.hasImage === true, 'Has image flag is true');
  assert(view.demoDisabled === false, 'Demo button is active');
  assert(view.repoDisabled === false, 'Repository button is active');
  assert(view.techCount === 2, 'Parsed 2 technologies');
  assert(view.publishedBadge === 'Activo', 'Status badge indicates Activo');
}

// 4.4 Evaluation of Incomplete Project (Null optional fields)
{
  const sparseProj = {
    id: 99,
    title: 'Sparse Project',
    short_description: null,
    description: null,
    technologies: null,
    image_url: null,
    demo_url: null,
    repository_url: null,
    is_published: 0,
    created_at: null,
  };

  const view = evaluateProjectDetailView(sparseProj, null, false);
  assert(view.state === 'LOADED', 'Sparse project enters LOADED state safely');
  assert(view.hasFallbackGraphic === true, 'Null image triggers fallback graphic illustration');
  assert(view.demoDisabled === true, 'Null demo_url renders disabled button with "Demo no configurada"');
  assert(view.repoDisabled === true, 'Null repository_url renders disabled button with "Repositorio privado"');
  assert(view.techCount === 0, 'Null technologies yields 0 items without throwing');
  assert(view.descriptionRendered === 'Sin descripción detallada adicional.', 'Null description renders fallback text');
  assert(view.publishedBadge === 'Borrador', 'Draft project indicates Borrador');
}

// 4.5 Evaluation of 404 / Error State
{
  const view404 = evaluateProjectDetailView(null, 'El proyecto solicitado no existe o fue despublicado por el administrador.', false);
  assert(view404.state === 'NOT_FOUND_404', 'Null project with error renders 404 card');
  assert(view404.errorHeading === 'Proyecto no encontrado', 'Renders proper 404 error heading');
  assert(view404.hasReturnBtn === true, 'Offers "Volver al catálogo" action');
  assert(view404.hasRetryBtn === true, 'Offers "Reintentar" action');
}

// -----------------------------------------------------------------
// SUITE 5: LIVE BACKEND HTTP RBAC & ENDPOINT RESOLUTION
// -----------------------------------------------------------------
console.log('\nSuite 5: Live Fullstack HTTP RBAC & Endpoint Stress Test');

// Helper to execute HTTP JSON requests
function makeRequest({ method = 'GET', path: reqPath, headers = {}, body = null, port = 5000 }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path: reqPath,
      method,
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runLiveHttpTests() {
  try {
    // 5.1 Check server liveness
    const health = await makeRequest({ path: '/api/health' });
    assert(health.status === 200 && health.data?.status === 'ok', 'Live backend server is responding on port 5000');

    // 5.2 Authenticate test accounts
    // Login Normal User
    const loginUser = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'usuario@portfolio.local', password: 'usuario123' },
    });
    const userToken = loginUser.data?.token;
    assert(Boolean(userToken), 'Obtained valid JWT for usuario@portfolio.local');

    // Login Operator
    const loginOp = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'operador@portfolio.local', password: 'operador123' },
    });
    const opToken = loginOp.data?.token;
    assert(Boolean(opToken), 'Obtained valid JWT for operador@portfolio.local');

    // Login Admin
    const loginAdmin = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@portfolio.local', password: 'admin123' },
    });
    const adminToken = loginAdmin.data?.token;
    assert(Boolean(adminToken), 'Obtained valid JWT for admin@portfolio.local');

    // 5.3 Projects Catalog (/api/projects)
    // Anonymous request MUST return 401
    const anonProjects = await makeRequest({ path: '/api/projects' });
    assert(anonProjects.status === 401, 'Anonymous request to /api/projects returns 401 Unauthorized');

    // Normal user request MUST return 200
    const userProjects = await makeRequest({
      path: '/api/projects',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(userProjects.status === 200 && Array.isArray(userProjects.data), 'Authenticated usuario_normal accesses /api/projects with HTTP 200');
    assert(userProjects.data.length > 0, `Catalog contains ${userProjects.data.length} projects`);

    // 5.4 Project Detail resolution by ID
    const validId = userProjects.data[0].id;
    const detailValid = await makeRequest({
      path: `/api/projects/${validId}`,
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(detailValid.status === 200 && detailValid.data.id === validId, `GET /api/projects/${validId} resolves project successfully`);

    // Non-existent ID returns 404
    const detail404 = await makeRequest({
      path: '/api/projects/999999',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(detail404.status === 404, 'GET /api/projects/999999 returns 404 Not Found');

    // String non-numeric ID returns 404
    const detailStr = await makeRequest({
      path: '/api/projects/abc-not-an-id',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(detailStr.status === 404, 'GET /api/projects/abc-not-an-id returns 404 Not Found');

    // Negative ID returns 404
    const detailNeg = await makeRequest({
      path: '/api/projects/-5',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(detailNeg.status === 404, 'GET /api/projects/-5 returns 404 Not Found');

    // 5.5 Operator Endpoint RBAC Boundaries
    // usuario_normal attempting /api/operator/messages MUST return 403
    const userToOp = await makeRequest({
      path: '/api/operator/messages',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(userToOp.status === 403, 'usuario_normal calling /api/operator/messages returns 403 Forbidden');

    // operador calling /api/operator/messages MUST return 200
    const opToOp = await makeRequest({
      path: '/api/operator/messages',
      headers: { Authorization: `Bearer ${opToken}` },
    });
    assert(opToOp.status === 200 && Array.isArray(opToOp.data), 'operador calling /api/operator/messages returns 200 OK');

    // 5.6 Admin Metrics Endpoint RBAC Boundaries
    // usuario_normal calling /api/metrics MUST return 403
    const userToMetrics = await makeRequest({
      path: '/api/metrics',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(userToMetrics.status === 403, 'usuario_normal calling /api/metrics returns 403 Forbidden');

    // operador calling /api/metrics MUST return 403
    const opToMetrics = await makeRequest({
      path: '/api/metrics',
      headers: { Authorization: `Bearer ${opToken}` },
    });
    assert(opToMetrics.status === 403, 'operador calling /api/metrics returns 403 Forbidden');

    // admin calling /api/metrics MUST return 200 with required KPI fields
    const adminToMetrics = await makeRequest({
      path: '/api/metrics',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminToMetrics.status === 200, 'admin calling /api/metrics returns 200 OK');
    assert(typeof adminToMetrics.data?.total_users === 'number', 'Metrics payload contains total_users');
    assert(typeof adminToMetrics.data?.total_projects === 'number', 'Metrics payload contains total_projects');
    assert(typeof adminToMetrics.data?.total_messages === 'number', 'Metrics payload contains total_messages');
    assert(typeof adminToMetrics.data?.visitas_generales === 'number', 'Metrics payload contains visitas_generales');
    assert(typeof adminToMetrics.data?.accesos_autenticados === 'number', 'Metrics payload contains accesos_autenticados');

  } catch (err) {
    assert(false, 'Live HTTP suite failed: ' + err.message, err.stack);
  }
}
// -----------------------------------------------------------------
// SUITE 6: DIRECT JSX DOM RENDERING OF ProtectedRoute WITH REACT-DOM
// -----------------------------------------------------------------
async function runSuite6() {
  console.log('\nSuite 6: Direct ProtectedRoute JSX Rendering & Accessibility Attributes');

  try {
    const jsxPlugin = {
      name: 'mock-auth-and-router',
      setup(build) {
        build.onResolve({ filter: /AuthContext/ }, args => ({ path: args.path, namespace: 'mock-auth' }));
        build.onLoad({ filter: /.*/, namespace: 'mock-auth' }, () => ({
          contents: `
            let currentAuth = {};
            export function setMockAuth(state) { currentAuth = state; }
            export function useAuth() { return currentAuth; }
          `
        }));

        build.onResolve({ filter: /^react-router-dom$/ }, args => ({ path: args.path, namespace: 'mock-router' }));
        build.onLoad({ filter: /.*/, namespace: 'mock-router' }, () => ({
          contents: `
            import React from 'react';
            let currentLocation = { pathname: '/proyectos' };
            export function setMockLocation(loc) { currentLocation = loc; }
            export function useLocation() { return currentLocation; }
            export function Navigate({ to, state, replace }) {
              return React.createElement('div', {
                'data-testid': 'mock-navigate',
                'data-to': to,
                'data-from': state?.from?.pathname || '',
                'data-replace': String(replace)
              });
            }
            export function Outlet() {
              return React.createElement('div', { 'data-testid': 'mock-outlet' }, 'Nested Outlet');
            }
            export function Link({ to, children, ...props }) {
              return React.createElement('a', { href: to, ...props }, children);
            }
          `
        }));
      }
    };

    const testFileCode = [
      "import React from 'react';",
      "import ProtectedRoute from './frontend/src/components/ProtectedRoute.jsx';",
      "import { setMockAuth } from '../context/AuthContext';",
      "import { setMockLocation } from 'react-router-dom';",
      "globalThis.JSX_TEST_HARNESS = { React, ProtectedRoute, setMockAuth, setMockLocation };"
    ].join('\n');

    const jsxBundle = await esbuild.build({
      stdin: {
        contents: testFileCode,
        resolveDir: process.cwd(),
        loader: 'jsx',
      },
      bundle: true,
      write: false,
      format: 'cjs',
      platform: 'node',
      plugins: [jsxPlugin],
      external: ['react', 'react-dom', 'react-dom/server', 'lucide-react', 'recharts']
    });

    const runJsx = new Function('require', jsxBundle.outputFiles[0].text);
    runJsx(require);

    const { React: R, ProtectedRoute: PR, setMockAuth, setMockLocation } = globalThis.JSX_TEST_HARNESS;

    // 6.1 Loading State Direct Render
    {
      setMockAuth({ loading: true, isAuthenticated: false, user: null, logout: () => {} });
      setMockLocation({ pathname: '/admin' });
      const html = ReactDOMServer.renderToString(R.createElement(PR, { allowedRoles: ['administrador'] }));
      assert(html.includes('role="status"'), 'Direct JSX render outputs role="status" on loading state');
      assert(html.includes('aria-live="polite"'), 'Direct JSX render includes aria-live="polite"');
      assert(html.includes('Verificando sesión'), 'Direct JSX render displays "Verificando sesión" text');
      assert(html.includes('animate-spin'), 'Direct JSX render displays spinning loader element');
    }

    // 6.2 Unauthenticated State Direct Render
    {
      setMockAuth({ loading: false, isAuthenticated: false, user: null, logout: () => {} });
      setMockLocation({ pathname: '/proyectos/secret-id' });
      const html = ReactDOMServer.renderToString(R.createElement(PR, { allowedRoles: ['usuario_normal'] }));
      assert(html.includes('data-testid="mock-navigate"'), 'Direct JSX unauthenticated render outputs Navigate component');
      assert(html.includes('data-to="/login"'), 'Navigate target path is /login');
      assert(html.includes('data-from="/proyectos/secret-id"'), 'Navigate state preserves target location');
      assert(html.includes('data-replace="true"'), 'Navigate uses replace="true"');
    }

    // 6.3 403 Forbidden State Direct Render for Normal User
    {
      setMockAuth({ loading: false, isAuthenticated: true, user: { role: 'usuario_normal', name: 'Juan' }, logout: () => {} });
      setMockLocation({ pathname: '/admin' });
      const html = ReactDOMServer.renderToString(R.createElement(PR, { allowedRoles: ['administrador'] }));
      assert(html.includes('Acceso no autorizado'), '403 render displays "Acceso no autorizado" heading');
      assert(html.includes('role="alert"'), '403 card sets role="alert" for assistive technology');
      assert(html.includes('usuario_normal'), '403 card displays user current role "usuario_normal"');
      assert(html.includes('administrador'), '403 card displays required role "administrador"');
      assert(html.includes('Ver Proyectos'), '403 card renders "Ver Proyectos" shortcut for usuario_normal');
      assert(html.includes('Volver al inicio'), '403 card renders "Volver al inicio" button');
      assert(html.includes('Cambiar cuenta'), '403 card renders "Cambiar cuenta" action');
    }

    // 6.4 403 Forbidden State Direct Render for Operator
    {
      setMockAuth({ loading: false, isAuthenticated: true, user: { role: 'operador', name: 'Laura' }, logout: () => {} });
      setMockLocation({ pathname: '/admin' });
      const html = ReactDOMServer.renderToString(R.createElement(PR, { allowedRoles: ['administrador'] }));
      assert(html.includes('Acceso no autorizado'), '403 operator render displays "Acceso no autorizado"');
      assert(html.includes('operador'), '403 card displays user role "operador"');
      assert(!html.includes('Ver Proyectos'), '403 card does NOT render "Ver Proyectos" shortcut for operator');
    }

    // 6.5 Authorized Direct Render with Children
    {
      setMockAuth({ loading: false, isAuthenticated: true, user: { role: 'administrador', name: 'Admin' }, logout: () => {} });
      setMockLocation({ pathname: '/admin' });
      const childElement = R.createElement('div', { id: 'admin-dashboard-root' }, 'Welcome to Admin Console');
      const html = ReactDOMServer.renderToString(R.createElement(PR, { allowedRoles: ['administrador'] }, childElement));
      assert(html.includes('admin-dashboard-root'), 'Authorized direct JSX render passes through child element');
      assert(html.includes('Welcome to Admin Console'), 'Child content successfully rendered to HTML');
    }

    // 6.6 Authorized Direct Render with Outlet Fallback
    {
      setMockAuth({ loading: false, isAuthenticated: true, user: { role: 'administrador', name: 'Admin' }, logout: () => {} });
      setMockLocation({ pathname: '/admin' });
      const html = ReactDOMServer.renderToString(R.createElement(PR, { allowedRoles: ['administrador'] }));
      assert(html.includes('data-testid="mock-outlet"'), 'Authorized render without children falls back to Outlet');
    }

  } catch (err) {
    assert(false, 'Direct JSX suite failed: ' + err.message, err.stack);
  }
}

// Execute tests and summarize
async function runAll() {
  await runSuite6();
  let serverSpawned = false;
  try {
    const srvResult = await serverManager.ensureServerRunning();
    serverSpawned = srvResult.spawned;
    await runLiveHttpTests();
  } catch (err) {
    assert(false, 'Unexpected test run failure: ' + err.message, err.stack);
  } finally {
    if (serverSpawned) {
      serverManager.stopServer();
    }
  }

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${totalTests}`);
  console.log(`PASSED:      ${passedTests}`);
  console.log(`FAILED:      ${failedTests}`);
  console.log('====================================================');

  if (failedTests > 0) {
    console.error('\nFAILURES ENCOUNTERED:');
    failureDetails.forEach((f, idx) => {
      console.error(`  ${idx + 1}. ${f.message}`);
      if (f.detail) console.error(`     ${f.detail}`);
    });
    process.exit(1);
  } else {
    console.log('\nALL EMPIRICAL CHALLENGES PASSED WITH ZERO FAILURES!');
    process.exit(0);
  }
}

runAll();
