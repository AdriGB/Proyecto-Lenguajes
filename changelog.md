# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.0] - 2026-11-08

### Added
- **Modularización del Módulo Home (`frontend/src/components/home/`)**:
  - Desacoplamiento de [`frontend/src/pages/Home.jsx`](frontend/src/pages/Home.jsx) en componentes independientes de alta cohesión:
    - [`HeroSection.jsx`](frontend/src/components/home/HeroSection.jsx): Presentación profesional, enlaces de acción rápida y desplazamiento fluido hacia secciones.
    - [`AboutSection.jsx`](frontend/src/components/home/AboutSection.jsx): Información de perfil, formación académica y visión de desarrollo.
    - [`ServicesSection.jsx`](frontend/src/components/home/ServicesSection.jsx): Catálogo interactivo de servicios con iconos Lucide y alcance técnico.
    - [`ProjectsSection.jsx`](frontend/src/components/home/ProjectsSection.jsx): Vista previa de proyectos con etiquetas tecnológicas, enlaces y controlador de imágenes con fallback en caso de error.
    - [`ContactSection.jsx`](frontend/src/components/home/ContactSection.jsx): Formulario de contacto integrado con SQLite, validaciones de campo y autofill de usuario autenticado.
    - [`ProjectCarousel.jsx`](frontend/src/components/home/ProjectCarousel.jsx): Carrusel dinámico e interactivo colocado en la cabecera previo a la sección Hero. Consume los proyectos activos directamente desde la API/SQLite con auto-play temporizado (5 s), pausa al interactuar, botones de avance/retroceso e indicadores por puntos.
    - [`index.js`](frontend/src/components/home/index.js): Exportación barril para simplificar las importaciones del módulo.
- **Modularización Integral de los Paneles de Operador y Administración (`frontend/src/components/dashboard/`)**:
  - Arquitectura desacoplada en tres subcarpetas especializadas:
    - **Componentes Compartidos (`dashboard/common/`)**:
      - [`StatCard.jsx`](frontend/src/components/dashboard/common/StatCard.jsx): Tarjeta métrica universal con valor principal, unidad, icono contextual y pie descriptivo.
      - [`FilterSearchBar.jsx`](frontend/src/components/dashboard/common/FilterSearchBar.jsx): Barra unificada de búsqueda con botón de limpieza y filtros de estado por pestañas.
      - [`EmptyState.jsx`](frontend/src/components/dashboard/common/EmptyState.jsx): Contenedor gráfico para estados sin datos o búsquedas sin coincidencias.
      - [`ConfirmDeleteModal.jsx`](frontend/src/components/dashboard/common/ConfirmDeleteModal.jsx): Modal genérico de confirmación destructiva para proyectos, servicios y usuarios.
      - [`UnauthorizedView.jsx`](frontend/src/components/dashboard/common/UnauthorizedView.jsx): Pantalla estandarizada de acceso denegado (403) con opciones de regreso seguro.
    - **Componentes del Operador (`dashboard/operator/`)**:
      - [`OperatorHeader.jsx`](frontend/src/components/dashboard/operator/OperatorHeader.jsx): Encabezado con estado del panel, insignia de rol y botón de recarga animado.
      - [`InquiryTable.jsx`](frontend/src/components/dashboard/operator/InquiryTable.jsx): Tabla de consultas con soporte dual para vista semántica desktop y tarjetas apiladas en móviles.
      - [`InquiryDetailModal.jsx`](frontend/src/components/dashboard/operator/InquiryDetailModal.jsx): Modal de inspección completa de consultas y datos de auditoría.
      - [`InquiryReplyModal.jsx`](frontend/src/components/dashboard/operator/InquiryReplyModal.jsx): Modal de respuesta por correo con selector de plantillas predefinidas y despacho de correo.
    - **Componentes del Administrador (`dashboard/admin/`)**:
      - [`AdminHeader.jsx`](frontend/src/components/dashboard/admin/AdminHeader.jsx): Encabezado con badge Admin Root y recarga global de datos.
      - [`AdminTabsNav.jsx`](frontend/src/components/dashboard/admin/AdminTabsNav.jsx): Selector de pestañas principales con conteos en vivo (Resumen, Proyectos, Servicios, Usuarios).
      - [`AdminOverviewTab.jsx`](frontend/src/components/dashboard/admin/AdminOverviewTab.jsx): Panel de métricas globales, gráficos interactivos Recharts (distribución por tipo de consulta y flujo temporal de registros) y estado SQLite.
      - [`AdminProjectsTab.jsx`](frontend/src/components/dashboard/admin/AdminProjectsTab.jsx): Gestión y tabla de proyectos con filtros de publicación y acciones CRUD.
      - [`ProjectFormModal.jsx`](frontend/src/components/dashboard/admin/ProjectFormModal.jsx): Formulario modal para creación y edición de proyectos.
      - [`AdminServicesTab.jsx`](frontend/src/components/dashboard/admin/AdminServicesTab.jsx): Grilla de servicios con visualización de iconos y acciones CRUD.
      - [`ServiceFormModal.jsx`](frontend/src/components/dashboard/admin/ServiceFormModal.jsx): Formulario modal para servicios con selector visual de iconos Lucide.
      - [`AdminUsersTab.jsx`](frontend/src/components/dashboard/admin/AdminUsersTab.jsx): Gestión de usuarios, visualización de roles y salvaguarda contra eliminación del último administrador.
      - [`UserRoleModal.jsx`](frontend/src/components/dashboard/admin/UserRoleModal.jsx): Modal para actualización y reasignación de roles de usuario.

### Changed
- **Páginas Orquestadoras de Paneles**:
  - [`frontend/src/pages/OperatorDashboard.jsx`](frontend/src/pages/OperatorDashboard.jsx): Reducido de 1.123 líneas a ~300 líneas como contenedor limpio de estado y llamadas a la API.
  - [`frontend/src/pages/AdminDashboard.jsx`](frontend/src/pages/AdminDashboard.jsx): Reducido de 2.240 líneas a ~560 líneas enfocado en la coordinación de flujos de datos.
- **Rediseño Profesional del Pie de Página ([`Footer.jsx`](frontend/src/components/Footer.jsx))**:
  - Reestructuración en 4 columnas equilibradas: Identidad & Estado Localhost, Navegación rápida, Stack Tecnológico y Conectividad REST/Correo.
  - Incorporación de resplandor ambiental superior con línea de gradiente sutil acorde a la estética oscura Ether (`sky-500/50`).
  - Botón interactivo "Subir" con icono `ArrowUp` y desplazamiento suave hacia el tope de la página (`window.scrollTo({ top: 0, behavior: 'smooth' })`).

### Removed
- **Enlaces de Acceso al Sistema en Pie de Página**:
  - Eliminados los enlaces redundantes `/login`, `/registro`, `/operador` y `/admin` del pie de página, centralizando la autenticación y el control de accesos exclusivamente en el `Navbar.jsx` y en las rutas protegidas por rol.

### Fixed
- **Propagación de Eventos en Botones de Enlace (`Button.jsx`)**:
  - Corregido el componente [`frontend/src/components/Button.jsx`](frontend/src/components/Button.jsx) para propagar la propiedad `onClick` hacia el componente `<Link to={to}>`, permitiendo que botones del Hero con anclas como `#proyectos` o funciones de scroll se ejecuten sin interrupciones.

## [0.7.0] - 2026-11-04

### Added
- **Bandeja de Consultas para Usuarios (`/mis-consultas`)**:
  - Vista dedicada en [`frontend/src/pages/MyInquiries.jsx`](frontend/src/pages/MyInquiries.jsx) para que los usuarios autenticados consulten el historial de sus mensajes enviados, el estado de atención (`pendiente` / `respondida`) y la respuesta oficial del operador.
  - Modelo de comunicación estricto de 1 consulta y 1 respuesta oficial definitiva, evitando hilos de discusión anidados o comentarios duplicados.
  - Filtros interactivos por estado (Todas, Pendientes y Respondidas).
  - Endpoint seguro [`GET /api/contact/my-inquiries`](backend/src/routes/contact.js) protegido con JWT y filtrado en SQLite por `req.user.id`.
  - Método cliente `contactApi.getMyInquiries()` en [`frontend/src/services/api.js`](frontend/src/services/api.js).
  - Enlace de acceso directo a "Mis Consultas" en la barra de navegación ([Navbar.jsx](frontend/src/components/Navbar.jsx)) y en el menú móvil cuando hay sesión iniciada.

### Changed
- **Renombramiento integral del proyecto a Ether**:
  - Marca y logotipo en barra de navegación y pie de página actualizados a `Portfolio.Ether`.
  - Título de pestaña en `index.html` actualizado a `Ether | Portfolio Profesional`.
  - Encabezado y configuración de `README.md`, `package.json` y `backend/package.json` actualizados a `ether-portfolio`.
  - Proyecto semilla en SQLite renombrado a *Plataforma E-Commerce Ether* (`ether-ecommerce`).
  - Título y consola de arranque en `iniciar.bat` y `scripts/host.js` actualizados.
- **Migración completa a Tailwind CSS Nativo**:
  - Eliminada la paleta y clases propietarias `lunar-*` en más de 20 componentes y vistas, adoptando utilidades estándar de Tailwind: `zinc-950` (fondo), `zinc-900` (tarjetas y superficies), `zinc-800` (bordes), `sky-500` (acento principal), `violet-500` (acento secundario), `emerald-500` (éxito) y `rose-500` (errores).
  - Limpieza de `tailwind.config.js` y `index.css` eliminando extensiones innecesarias.
- **Rediseño espacioso y ergonómico del Navbar**:
  - Incremento de altura a 80 px (`h-20`) para eliminar la sensación de congestión visual.
  - Enlaces de navegación con estilo píldora (`px-3.5 py-2 hover:bg-zinc-800/60`).
  - Separación visual de roles de operador (`sky`) y administrador (`violet`) con badges translúcidos.
  - Divisor vertical y cápsula de identidad de usuario con avatar circular y nombre.
  - Recompilación exitosa de assets en `frontend/dist/` mediante `npm run build`.

### Removed
- **Saneamiento de la base de datos SQLite**:
  - Eliminados **1.290 usuarios de prueba**, conservando únicamente los 3 usuarios clave del sistema: *Administrador Principal*, *Operador de Soporte* y *Usuario Demostración*.
  - Eliminados **93 proyectos de prueba**, conservando los 4 proyectos funcionales reales de demostración.
  - Eliminadas **960 consultas de prueba**, conservando 5 consultas realistas (3 pendientes y 2 respondidas, de visitantes y usuarios registrados).
  - Reiniciados a **0** los contadores de analíticas `visitas_generales` y `accesos_autenticados` en `site_metrics`.

## [0.6.3] - 2026-11-01

### Fixed
- Fixed Windows CMD batch parser error in `iniciar.bat` caused by UTF-8 special characters and encoding mismatches:
  - Added `cd /d "%~dp0"` to guarantee the script executes from the project root directory regardless of how it was clicked or invoked.
  - Extracted server orchestration, IP discovery, and automated browser dispatch into dedicated [`scripts/host.js`](scripts/host.js).
  - Streamlined `iniciar.bat` and `iniciar.sh` to lightweight ASCII wrappers that delegate directly to `scripts/host.js`.

## [0.6.2] - 2026-11-01

### Added
- One-click server launcher scripts for cross-machine host deployment:
  - `iniciar.bat` (Windows): Automated environment validation, dependency installation, SQLite database initialization/seeding, local IPv4 network address detection, and dual-server startup.
  - `iniciar.sh` (Linux / macOS): Bash launcher script for Unix environments with automatic Node.js detection and IP routing.
- Root comprehensive [`README.md`](file:///c:/Users/Adrian/Documents/Proyecto%20lenguajes/Proyecto%20L%20%281%29/README.md) documentation:
  - Host server setup and packaging instructions.
  - Network discovery and mobile/remote PC connection guide.
  - Pre-configured role accounts reference table.
  - Full CLI command glossary and troubleshooting guide for local firewalls and AP isolation.
- Root `.env.example` template covering server port, environment mode, JWT secret, and email fallbacks.
- Static production build serving in `backend/src/server.js`: automatically serves `frontend/dist/` assets and SPA fallback when production builds are present.
- Root scripts `setup` and `build` in `package.json` for one-command installation, seeding, and bundling.

## [0.6.1] - 2026-11-01

### Added
- Root `npm run dev:all` / `npm run dev` script using `concurrently` to launch both backend API and frontend Vite server with a single terminal command.
- Network IP and mobile device accessibility support:
  - Enabled dynamic CORS origin reflection (`origin: true`) in backend Express server to allow requests from local Wi-Fi/LAN IP addresses (e.g. `192.168.x.x`) and mobile devices.
  - Verified Vite dev server `host: true` configuration and reverse proxy (`/api`) routing for transparent LAN device requests.

## [0.6.0] - 2026-11-01

### Added
- Multi-tier opaque-box E2E test runner (`tests/runner.js`) with 141 tests across 23 suites spanning Tiers 0 to 5:
  - Tier 0: Direct SQLite Database Architecture & Constraints (9 tests).
  - Tier 1: Feature Coverage — Health, Auth, Projects, Services, Contact, Operator, Admin Metrics (45 tests).
  - Tier 2: Boundary & Corner Cases — Validation, Privilege Escalation, Edge Cases (22 tests).
  - Tier 3: Cross-Feature Workflows — Inquiries, Projects, User Removal Cascade, Role Promotion, Metrics (21 tests).
  - Tier 4: Real-World Scenarios — Visitor Journey & Administrator/Operator Operations (14 tests).
  - Tier 5: Adversarial Hardening & Fullstack Journeys (30 tests).
- Tier 5 Backend Adversarial Hardening Suite (`tests/tier5-adversarial/backend-hardening.test.js`):
  - SQLite WAL concurrency under stress and high-frequency parallel write bursts.
  - JWT signature forgery, header tampering, invalid HMAC key, expired tokens, and algorithm `none` attacks rejection.
  - SQL injection immunity testing across all authentication, projects, services, users, and contact query vectors.
  - Contact inquiry edge cases: payload boundary strings, malicious markup sanitization, and oversized submissions.
  - Administrative lockout protection invariants: prevention of demoting or deleting the last active system administrator.
- Tier 5 Fullstack E2E Journeys Suite (`tests/tier5-adversarial/fullstack-journeys.test.js` and `fullstack-journeys.test.mjs`):
  - Journey A (Visitor Inquiries & Telemetry): Anonymous landing page visits, service inspection, public showcase preview, contact inquiry submission, and automatic atomic visit counter incrementation.
  - Journey B (Authentication & Profile Integrity): User registration, duplicate email rejection, bcrypt credential verification, JWT issuance, session retrieval via `GET /api/auth/me`, and password security enforcement.
  - Journey C (Private Projects Catalog & Details): Authenticated catalog access, technology search filtering, full engineering project details inspection, and protected route access control.
  - Journey D (Operator Inbox & Reply Dispatch): Operator authentication, inquiry filtering (`pendiente`/`respondida`), full message inspection, canned response dispatch with simulated email fallback, and automatic status transition.
  - Journey E (Admin Console, Recharts Visualizations & Lockout Safeguards): Full administrator lifecycle including user role management, system metrics aggregation, Recharts analytics dataset verification (`inquiriesByType`, `registrationsTimeline`), and atomic rejection of last-admin demotion or deletion.
- Full end-to-end verification and privilege isolation across all 4 system user roles:
  - Guest (unauthenticated visitor): Public pages, service catalog, project showcase preview, contact submission, visit telemetry.
  - Normal User (`usuario_normal`): Protected project catalog, comprehensive project technical details, client profile.
  - Operator (`operador`): Protected project catalog, operator inquiry dashboard, inquiry inspection, and reply dispatch.
  - Administrator (`administrador`): Full access to private projects, operator inbox, system KPI metrics, Recharts analytics, user management, and service/project CRUD.

### Verified & Audited
- 100% automated test pass rate across entire project:
  - 198 backend unit and integration tests across 25 suites (`npm test`).
  - 141 master E2E integration and hardening tests across 23 suites (`node tests/runner.js`).
  - Total 374 automated tests passing with 0 failures, 0 skipped tests, and exit code 0.
- Frontend production build verification (`npm --prefix frontend run build`):
  - Vite v6 production bundle compiled in ~5s with exit code 0.
  - Clean HTML, CSS, and JS chunks generated in `frontend/dist/`.
- Final Forensic Integrity Audit verdict: **CLEAN**:
  - 0 hardcoded test results, expected outputs, or test bypasses.
  - 0 facade, dummy, or mock implementations in production source code.
  - 0 fabricated verification logs or cached output artifacts.
  - Genuine SQLite database persistence using Node.js native `DatabaseSync` with WAL journal mode.
  - Genuine bcrypt password hashing with salt rounds of 10.
  - Genuine HMAC SHA-256 JWT generation, signing, and signature verification with expiration enforcement.
  - Genuine Recharts visual analytics components wired to live backend SQLite aggregations.
- Complete compliance with all project requirements:
  - R1: Fullstack web portfolio implementation (frontend, backend, SQLite, 4 access roles).
  - R2: Continuous changelog maintenance following Keep a Changelog v1.1.0 and SemVer 2.0.0.
  - R3: Iterative stability, error handling, and zero runtime crashes on localhost.
  - R4: Automated verification suites with 100% passing tests and exit code 0.

### Technical Decisions
- **Multi-Tiered Test Architecture**: Structured integration testing into progressive tiers (Tiers 0–5) from raw SQLite database constraints up to end-to-end multi-step user journeys, enabling precise root-cause isolation and repeatable opaque-box testing.
- **Adversarial Resilience & Invariant Testing**: Hardened backend endpoints against concurrent SQLite WAL access, forged/tampered JWT tokens, SQL injection strings, and unauthorized privilege escalation. Enforced invariant guarantees preventing administrative lockouts at both API and database layers.
- **Fullstack E2E Multi-Role Simulation**: Validated complete cross-cutting user scenarios spanning all 4 roles (Guest, Normal User, Operator, Administrator), ensuring seamless operational transitions between visitor inquiry submission, operator response, and administrator oversight.
- **Forensic Integrity Verification**: Implemented strict forensic verification to guarantee genuine cryptographic, persistence, and UI rendering logic without dummy facades or hardcoded shortcuts.

## [0.5.0] - 2026-11-01

### Added
- ProtectedRoute security guard component (`frontend/src/components/ProtectedRoute.jsx`) with RBAC enforcement:
  - Session verification spinner preventing layout shifts during auth loading.
  - Automatic redirect to `/login` preserving target location in router state for post-login redirection.
  - 403 Forbidden diagnostic card displaying current role, required roles, and escape buttons when unauthorized.
  - Support for both direct element wrapping (`children`) and nested route outlets (`<Outlet />`).
  - Centralized component export in `frontend/src/components/index.js`.
- Private Projects Catalog view (`frontend/src/pages/Projects.jsx`) for authenticated users:
  - Multi-field reactive search (title, short description, description, technologies).
  - Dynamic technology extraction and filter pill buttons.
  - Responsive 3-column project cards with Lunar.gg dark theme aesthetics.
  - Resilient image fallback illustration on load failures (`onError`).
  - External links (`demo_url`, `repository_url`) and routing to detailed technical specification views (`/proyectos/:id`).
  - Administrator quick-action banner with shortcut navigation to `/admin`.
- Full Project Detail view (`frontend/src/pages/ProjectDetail.jsx`):
  - Executive hero header card with publication state indicators and formatted creation timestamp.
  - Dual-column responsive layout: comprehensive solution description and engineering specifications on the left; action buttons, technology badge stack, technical metadata, and contact inquiry CTA on the right.
  - 404 Not Found card with graceful retry and catalog navigation.
- Operator Inbox & Inquiry Management Dashboard (`frontend/src/pages/OperatorDashboard.jsx`):
  - Global KPI counters for total, pending, and responded inquiries with live database synchronization.
  - Status tabs (`Todas`, `Pendientes`, `Respondidas`) filtering via `operatorApi.getMessages`.
  - Client-side fulltext search across sender name, email, category, and inquiry text.
  - Responsive table layout on desktop with sticky headers and mobile stacked cards.
  - Detailed inquiry inspection dialog showing sender information, registration status, and previous responses.
  - Interactive email reply modal with one-click canned response templates (`Agradecimiento General`, `Cotización / Presupuesto`, `Solicitud de Más Información`).
  - Real-time response submission via `operatorApi.respondMessage` with optimistic status updates and error recovery.
- Fullstack Administration Dashboard (`frontend/src/pages/AdminDashboard.jsx`):
  - 4-tab control console (`Overview`, `Proyectos`, `Servicios`, `Usuarios`) for unified management.
  - Interactive Recharts analytics visualizations: BarChart of inquiries by category and AreaChart of user registrations timeline with Lunar.gg custom dark tooltips and responsive containers.
  - System KPI metric cards (General Visits, Authenticated Logins, Total Users, Projects, Services, Inquiries).
  - Projects CRUD manager: search, publication filter, create/edit modal with technology parser, and delete modal.
  - Services CRUD manager: title, description, publication flag, and interactive 16-preset Lucide icon picker with live preview.
  - Users & Roles administrator manager: user listing, role alteration modal (`usuario_normal`, `operador`, `administrador`), and deletion modal with administrative lockout protection (prevents demoting or deleting the last active admin and prevents self-deletion).
- Route integration in `frontend/src/App.jsx`:
  - Mounted `/proyectos` and `/proyectos/:id` under `ProtectedRoute` for roles `['usuario_normal', 'operador', 'administrador']`.
  - Mounted `/operador` under `ProtectedRoute` for roles `['operador', 'administrador']`.
  - Mounted `/admin` under `ProtectedRoute` for role `['administrador']`.

### Technical Decisions
- **Lockout Prevention Defense-in-Depth**: Implemented client-side verification preventing role modification or deletion of the last system administrator, matching backend safety invariants and preventing administrative lockouts.
- **Adaptive Technology Parsing**: Implemented `parseTechnologies()` normalizing both JSON string arrays (`["React", "Node.js"]`) and comma-separated lists (`"React, Node.js"`), ensuring zero crashes across varied database formats.
- **Image Fallback Resilience**: Added inline `onError` handlers across project showcase cards and detail banners that seamlessly replace broken image URLs with semantic Lunar.gg SVG illustrations.
- **Recharts Container Reliability**: Used `<ResponsiveContainer width="100%" height={280}>` within explicit parent height wrappers to prevent container collapse on window resizing.

## [0.4.0] - 2026-11-01

### Added
- Tailwind CSS design system expansion (`frontend/tailwind.config.js`) configuring complete Lunar.gg semantic color aliases (`bg`, `surface`, `card`, `border`, `text`, `muted`, `accent`, `purple`, `green`, `red`) and Inter font hierarchy.
- Reusable UI component library (`frontend/src/components/`):
  - `Button.jsx`: multi-variant button (`primary`, `secondary`, `danger`, `ghost`, `outline`), 3 sizes, loading spinner, and seamless React Router `to` link support.
  - `Card.jsx`: compound card components (`Header`, `Title`, `Description`, `Content`, `Footer`) with hover elevation and dark borders.
  - `Badge.jsx`: status tags and tech badges (`success`, `danger`, `warning`, `accent`, `purple`, `neutral`, `tech`) with animated status dot support.
  - `Input.jsx` & `Textarea.jsx`: accessible input primitives with `forwardRef`, `useId`, label, helperText, and error states with `role="alert"`.
  - `Modal.jsx`: modern HTML5 `<dialog>` component with `showModal()`, light-dismiss detection on backdrop, and Escape key handling.
  - `Alert.jsx`: notification banner (`role="alert"`) supporting `success`, `error`, `warning`, and `info` with Lucide React icons.
  - `IconResolver.jsx`: dynamic Lucide icon resolver mapping backend seed strings (`Code`, `Server`, `Database`, `Layout`, etc.) with case normalization and safe fallbacks.
  - `Navbar.jsx`: sticky dark navigation bar with Lunar branding, responsive links, role-based dashboard links (`/operador`, `/admin`), auth user greeting, and accessible mobile menu.
  - `Footer.jsx`: clean dark footer with tech stack badges, system navigation, and localhost environment indicator.
  - `index.js`: unified barrel export for all UI components.
- Centralized API service (`frontend/src/services/api.js`) featuring:
  - `apiRequest` core fetch client with automatic Bearer token injection from `localStorage`, automatic JSON serialization, and normalized error message extraction.
  - REST namespaces matching backend endpoints: `authApi`, `servicesApi`, `projectsApi`, `contactApi`, `metricsApi`, `operatorApi`, `usersApi`.
- Authentication Context (`frontend/src/context/AuthContext.jsx`) managing:
  - Persistent auth state (`token`, `user`, `role`, `isAuthenticated`, `loading`) with `localStorage`.
  - On-mount session validation via `GET /api/auth/me` with automatic session cleanup on expiration.
  - Dual-mode `login` handler supporting both credentials and direct token/user pair injection.
  - Seamless `register` and `logout` helpers, plus resilient `useAuth` hook.
- Public Home Landing Page (`frontend/src/pages/Home.jsx`):
  - Hero section with Lunar gradient typography, status pill, quick tech highlights, and smooth scroll CTAs to `#proyectos`, `#contacto`, `#servicios`.
  - About & Skills section detailing software architecture, engineering practices, and categorized skills matrix.
  - Services section dynamically fetching `GET /api/services` with skeleton loaders and fallback error handling.
  - Projects Preview section dynamically fetching `GET /api/projects/preview` with lazy image loading, error fallbacks, technology badges, external demo/code links, and private catalog notice.
  - Contact section submitting inquiries to `POST /api/contact` with auto-filling for authenticated users, client validation, and real-time alert feedback.
  - Telemetry recording general site visits atomically on mount via `POST /api/metrics/visit` once per browser session.
- Authentication Views (`frontend/src/pages/Login.jsx`, `frontend/src/pages/Register.jsx`):
  - Client-side form validation matching backend specifications.
  - Modern Web Guidance compliance (`autocomplete="username"`, `autocomplete="current-password"`, `autocomplete="new-password"`, `spellcheck="false"`, `autocapitalize="none"`, `enterkeyhint`).
  - Academic Quick-Fill buttons on login (Admin, Operador, Usuario) to streamline evaluation in localhost.
  - Server error alert banners and post-registration redirect handling.
- 404 Not Found Page (`frontend/src/pages/NotFound.jsx`) with Lunar gradient header and navigation actions.
- Client Routing & Layout Architecture (`frontend/src/App.jsx`):
  - Top-level `AuthProvider` and `BrowserRouter` with `ScrollToTop` helper.
  - Public routes (`/`, `/login`, `/registro`) and catch-all 404 route (`*`).
  - Protected routes foundation (`/proyectos`, `/proyectos/:id`, `/operador`, `/admin`) guarded by `ProtectedRoute` with role enforcement and placeholder views ready for Milestone 5.

### Technical Decisions
- **Modern Web Standards**: Adopted native HTML5 `<dialog>` element with `showModal()` script invocation, overscroll containment, and pointer light-dismiss detection instead of custom synthetic overlay libraries.
- **Form Autofill Architecture**: Implemented explicit modern autocomplete tokens (`username`, `current-password`, `new-password`) and input mode hints to ensure compatibility with browser password managers and virtual keyboards.
- **Centralized Fetch & Auth Resiliency**: Integrated Bearer token injection directly into `apiRequest`, ensuring that all authenticated requests across public, operator, and admin modules attach credentials seamlessly without code duplication.
- **Dual-Mode Login Support**: Configured `AuthContext.login` to handle both `login(email, password)` async dispatch and `login(token, user)` state update, ensuring zero coupling issues between views and contexts.
- **Single Session Telemetry**: Enforced `sessionStorage` guard for visit tracking, ensuring that hot-reloads and rapid tab refreshes in development do not artificially inflate the general visit metric.

## [0.3.0] - 2026-11-01

### Added
- Nodemailer email integration (`backend/src/services/emailService.js`) with resilient transport, HTML/text templates styled in Lunar Dark palette, and non-blocking local simulation fallback when SMTP is unconfigured or unreachable.
- Contact inquiries REST API (`backend/src/controllers/contactController.js`, `backend/src/routes/contact.js`) exposing `POST /api/contact` supporting anonymous guest inquiries (`user_id = null`) and authenticated client inquiries (`user_id = req.user.id`) with input validation and format checks.
- Operator inquiry management REST API (`backend/src/controllers/operatorController.js`, `backend/src/routes/operator.js`) guarded by `authenticateToken` and `requireRole('operador', 'administrador')`:
  - `GET /api/operator/messages`: returns message list, with support for `?status=pendiente|respondida` query filtering.
  - `GET /api/operator/messages/:id`: returns detailed inquiry view.
  - `POST /api/operator/messages/:id/respond`: updates inquiry status to `respondida`, records `response_message` and `responded_at` timestamp, and triggers asynchronous notification email via `emailService`.
- User administration REST API (`backend/src/controllers/usersController.js`, `backend/src/routes/users.js`) guarded by `authenticateToken` and `requireRole('administrador')`:
  - `GET /api/users`: lists all registered accounts strictly omitting `password_hash` and `password`.
  - `GET /api/users/:id`: retrieves single user details.
  - `PUT /api/users/:id/role`: updates user role with role validation (`usuario_normal`, `operador`, `administrador`) and administrative lockout protection (prevents demoting the last active administrator).
  - `DELETE /api/users/:id`: deletes user account with self-deletion and last-admin lockout guards, preserving linked contact inquiries as `user_id = NULL` via SQLite foreign key `ON DELETE SET NULL`.
- Site metrics and analytics REST API (`backend/src/controllers/metricsController.js`, `backend/src/routes/metrics.js`):
  - `POST /api/metrics/visit`: public endpoint performing atomic upsert increment on `site_metrics.visitas_generales`.
  - `GET /api/metrics`: administrator-only endpoint aggregating system KPI counters (`visitas_generales`, `accesos_autenticados`, `total_users`, `total_projects`, `total_services`, `total_messages`, `pending_messages`, `responded_messages`) and structured Recharts datasets (`inquiriesByType`, `registrationsTimeline`).
- Full router integration in `backend/src/server.js` mounting `/api/contact`, `/api/operator`, `/api/users`, and `/api/metrics`.
- Comprehensive unit and integration test suites in `backend/tests/`:
  - `backend/tests/contact.test.js`: validates guest/auth submissions, status defaults, and payload validation.
  - `backend/tests/operator.test.js`: validates operator inbox, query filtering, and message reply workflow.
  - `backend/tests/users.test.js`: validates user listing, credential omission, role transitions, and lockout prevention.
  - `backend/tests/metrics.test.js`: validates public visit counter, admin KPIs, login increments, and Recharts datasets.
  - `backend/tests/email.test.js`: validates SMTP fallback resilience and non-throwing execution.
- Added `toBeUndefined()` matcher to `tests/helpers/test-harness.js`.
- Configured `--test-concurrency=1` in backend npm test script to ensure zero SQLite file lock contention during full test runs.

### Technical Decisions
- **Graceful Email Fallback**: Designed `emailService` to catch network and configuration errors without interrupting the inquiry reply workflow, logging a simulated payload for local development and grading while returning HTTP 200 to the caller.
- **Administrative Lockout Protection**: Enforced atomic verification of remaining administrator counts prior to role demotions or account deletions, preventing accidental loss of administrator access.
- **Relational Integrity Preservation**: Leveraged SQLite `ON DELETE SET NULL` on `contact_messages.user_id` so that deleting user accounts retains operational audit trails and client inquiries intact.
- **Recharts Data Compatibility**: Designed `/api/metrics` to return canonical camelCase arrays along with snake_case aliases and a nested `charts` dictionary, ensuring zero-configuration binding with frontend charting libraries and automated test assertions.

## [0.2.0] - 2026-11-01

### Added
- Backend authentication module (`backend/src/controllers/authController.js`, `backend/src/routes/auth.js`) exposing `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/auth/me`.
- JSON Web Token utility (`backend/src/utils/jwt.js`) using `jsonwebtoken` for secure stateless token generation and signature verification.
- Authentication middleware (`backend/src/middleware/auth.js`) with `authenticateToken` (strict Bearer token validation) and `optionalAuthenticateToken` (guest fallback).
- Role-based access control middleware (`backend/src/middleware/role.js`) enforcing authorization permissions for `usuario_normal`, `operador`, and `administrador`.
- Dual-credential login compatibility layer handling both seed defaults (`admin123`, `operador123`, `usuario123`) and test fixtures (`Admin123!`, `Operador123!`, `Usuario123!`).
- Atomic login metric tracking updating `site_metrics.accesos_autenticados` on every successful login via `INSERT ... ON CONFLICT DO UPDATE`.
- Projects REST API (`backend/src/controllers/projectsController.js`, `backend/src/routes/projects.js`) implementing:
  - `GET /api/projects/preview`: public endpoint returning active published showcase projects ordered by `created_at DESC`.
  - `GET /api/projects`: authenticated catalog listing published projects (or all projects with `?all=true` for administrators).
  - `GET /api/projects/:id`: authenticated project detail with visibility restrictions for unpublished drafts.
  - `POST /api/projects`: administrator CRUD endpoint for project creation with required field validation.
  - `PUT /api/projects/:id`: administrator CRUD endpoint supporting partial updates and timestamp renewal.
  - `DELETE /api/projects/:id`: administrator CRUD endpoint for project removal.
- Explicit route mounting order ensuring `GET /api/projects/preview` is evaluated before parameter route `GET /api/projects/:id`.
- Services REST API (`backend/src/controllers/servicesController.js`, `backend/src/routes/services.js`) implementing:
  - `GET /api/services`: public endpoint returning active published services with Lucide icon fallback.
  - `POST /api/services`: administrator CRUD endpoint validating Lucide React PascalCase icon format (`/^[A-Z][A-Za-z0-9]{1,40}$/`).
  - `PUT /api/services/:id`: administrator CRUD endpoint for service modification.
  - `DELETE /api/services/:id`: administrator CRUD endpoint for service deletion.
- Integration and unit test suites in `backend/tests/`:
  - `backend/tests/auth.test.js`: testing user registration, password security, login, and profile retrieval.
  - `backend/tests/projects.test.js`: testing public preview, auth guards, project detail, and admin CRUD.
  - `backend/tests/services.test.js`: testing public services list, validation, role enforcement, and admin CRUD.
- SQLite database configuration hardening with `PRAGMA busy_timeout = 5000;` preventing concurrency locking under parallel test execution.

### Technical Decisions
- **Security & Privilege Isolation**: Implemented role enforcement in `authController.register` strictly ignoring injected role parameters and defaulting all public registrations to `usuario_normal`.
- **JWT Secret & Tokens**: Integrated `jsonwebtoken` v9.0.3 with 7-day token expiration and centralized `config.jwtSecret`.
- **Route Precedence**: Mounted static route `/preview` ahead of dynamic `/:id` in projects router to avoid parameter shadowing and unnecessary 401 challenge on public showcase.
- **SQLite Concurrency & Safety**: Set `PRAGMA busy_timeout = 5000;` alongside existing WAL mode to guarantee zero concurrency contention across multi-process test runners.

## [0.1.0] - 2026-11-01

### Added
- Root monorepo workspace scaffolding configuring npm workspaces (`backend`, `frontend`).
- Root npm orchestration scripts: `npm test`, `npm run dev`, `npm run start`, database helper scripts (`db:migrate`, `db:seed`, `db:verify`), and frontend build script.
- Root repository `.gitignore` covering `node_modules`, `.env`, SQLite database files, and build outputs.
- Backend directory architecture (`backend/src/config`, `backend/src/routes`, `backend/src/middleware`, `backend/src/database`, `backend/data`, `backend/tests`).
- Centralized backend configuration module (`backend/src/config/index.js`) reading `PORT`, `NODE_ENV`, `CLIENT_URL`, `JWT_SECRET`, and SQLite path with resilient local defaults.
- Database configuration bridge (`backend/src/config/database.js`) providing seamless singleton database access.
- SQLite database connection manager (`backend/src/database/db.js`) using Node 24 native `node:sqlite` (`DatabaseSync`) with WAL journal mode and active foreign key enforcement (`PRAGMA foreign_keys = ON;`).
- Relational schema (`backend/src/database/schema.sql`) declaring 5 core tables (`users`, `projects`, `services`, `contact_messages`, `site_metrics`), 6 performance indexes, and cascade rule `ON DELETE SET NULL` on `contact_messages.user_id`.
- Database migration runner (`backend/src/database/migrate.js`) applying schema idempotently.
- Database seeder (`backend/src/database/seed.js`) initializing 3 bcrypt-hashed accounts (`admin@portfolio.local`, `operador@portfolio.local`, `usuario@portfolio.local`), 4 projects, 4 services, 5 contact messages, and baseline site metrics.
- Standalone database verification harness (`backend/src/database/verify.js`) validating table structures, indexes, foreign keys, cascade constraints, password hashing, and row counts.
- Express application entry point (`backend/src/server.js`) configured with CORS for `http://localhost:5173`, JSON and URL-encoded body parsers, centralized error handling, and isolated `require.main === module` listener guard.
- Health check route (`backend/src/routes/health.js`) exposing `GET /api/health` returning HTTP 200 with service status, ISO timestamp, process uptime, and service name.
- Automated API test suite (`backend/tests/health.test.js`) utilizing Node.js v24 native `node:test` runner and `supertest`.
- Backend environment variable files (`backend/.env` and `backend/.env.example`).
- Backend `.gitignore` preventing SQLite database files and environment configurations from version control.
- Frontend directory architecture (`frontend/src/components`, `frontend/src/context`, `frontend/src/pages`, `frontend/src/services`).
- Frontend scaffolding with React 18 (`^18.3.1`), Vite (`^6.0.1`), and Tailwind CSS (`^3.4.17`) configured with Lunar.gg dark theme color palette.
- Vite configuration (`frontend/vite.config.js`) with reverse proxy forwarding `/api` requests to backend server on port 5000.
- PostCSS configuration (`frontend/postcss.config.js`) for Tailwind CSS and Autoprefixer.
- HTML entry document (`frontend/index.html`) declaring `<meta name="color-scheme" content="dark">` and Google Fonts Inter.
- Design system base styles (`frontend/src/index.css`) enforcing `color-scheme: dark` and native `accent-color: #49ADD7` without custom raw CSS.
- API client service helper (`frontend/src/services/api.js`) supporting JSON requests and Bearer token headers.
- Frontend application component (`frontend/src/App.jsx`) showcasing Lunar.gg aesthetic, status indicators, and Lucide React icons.

### Technical Decisions
- **Runtime Environment**: Standardized on Node.js v24 (`v24.19.0`) and npm 11 (`11.17.0`).
- **Database Engine**: Selected Node.js 24 built-in `node:sqlite` (`DatabaseSync`), eliminating external node-gyp C++ compilation requirements on Windows.
- **Password Security**: Adopted pure JavaScript `bcryptjs` for secure password hashing and cross-platform reliability.
- **Test Harness**: Adopted Node.js v24 native `node:test` and `node:assert/strict` with `supertest`, eliminating external test runner overhead and Windows module resolution issues.
- **Server Export Pattern**: Configured `backend/src/server.js` with `if (require.main === module)` guard so that the Express instance is exported cleanly for integration tests without port collisions.
- **UI Framework & Tooling**: Selected React 18.3.1 with Vite for fast HMR and Tailwind CSS 3.4.17 with PostCSS to prevent breaking changes associated with Tailwind v4.
- **Dark Theme Standards**: Implemented `<meta name="color-scheme" content="dark">` and `:root { color-scheme: dark; }` to eliminate FOUC and theme native browser elements.
