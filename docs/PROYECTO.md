# Documento de Proyecto: Portfolio Profesional Ether

**Materia:** Proyecto de Lenguajes / Desarrollo Web Fullstack  
**Aplicación:** Portfolio Profesional & Plataforma de Showcase  
**Arquitectura:** Cliente-Servidor Desacoplada (Frontend SPA + REST API + SQLite)  
**Entorno de Ejecución:** Exclusivo en `localhost` (Demostración y Evaluación Académica)  
**Versión:** 0.8.0  

---

## 1. Resumen Ejecutivo y Objetivos

**Ether** es una plataforma web Fullstack desarrollada para la presentación profesional de proyectos, servicios y habilidades técnicas, incorporando control de acceso basado en roles (RBAC), gestión integral de consultas de contacto y un panel administrativo con métricas analíticas en tiempo real.

El sistema fue concebido para su evaluación y promoción académica, cumpliendo con estándares de arquitectura limpia, desacoplamiento modular, persistencia local robusta e interfaces adaptables a cualquier dispositivo.

### Objetivos Principales
1. **Showcase Profesional Dinámico:** Exhibir el perfil, servicios y proyectos de ingeniería mediante interfaces reactivas y componentes interactivos.
2. **Control de Acceso y Privacidad:** Proteger el catálogo técnico y el código fuente de los proyectos exclusivamente para usuarios registrados.
3. **Gestión de Consultas Bidireccional:** Procesar solicitudes de visitantes y usuarios con despacho de correos vía Nodemailer y seguimiento en la bandeja personal `/mis-consultas`.
4. **Administración Centralizada:** Ofrecer operaciones CRUD para proyectos y servicios, gestión de roles de usuario y telemetría visual con Recharts.

---

## 2. Arquitectura del Sistema y Tecnologías

El proyecto implementa una arquitectura desacoplada en tres capas independientes:

```text
┌─────────────────────────┐        HTTP / JSON        ┌─────────────────────────┐
│     Frontend (SPA)      │ ◄───────────────────────► │    Backend (REST API)   │
│  React 18 + Vite + TW   │     (JWT Bearer Auth)     │    Node.js 24 + Express │
└─────────────────────────┘                           └────────────┬────────────┘
                                                                   │ SQL (WAL)
                                                      ┌────────────▼────────────┐
                                                      │    Base de Datos Local  │
                                                      │     SQLite (Nativa)     │
                                                      └─────────────────────────┘
```

### Stack Tecnológico

| Componente | Tecnología | Rol en el Sistema |
|---|---|---|
| **Frontend** | React 18, Vite 6 | Renderizado declarativo y compilación optimizada en cliente. |
| **Enrutamiento** | React Router 6 | Navegación SPA y protección de rutas privadas (`ProtectedRoute`). |
| **Estilos** | Tailwind CSS Nativo | Sistema de diseño oscuro *Ether* (`zinc`, `sky`, `emerald`, `rose`). |
| **Iconografía** | Lucide React | Iconos vectoriales coherentes en toda la aplicación. |
| **Visualización** | Recharts | Gráficos estadísticos SVG para el panel de administración. |
| **Backend** | Node.js 24, Express 4 | API REST modular (rutas, controladores, middleware, servicios). |
| **Base de Datos** | SQLite (`better-sqlite3`) | Persistencia relacional local con modo WAL y foreign keys activas. |
| **Seguridad** | JWT + bcryptjs | Tokens de sesión seguros y cifrado de contraseñas (salt = 10). |
| **Mensajería** | Nodemailer | Despacho de notificaciones por correo con fallback de simulación local. |

### Organización Modular del Frontend
La interfaz abandonó estructuras monolíticas para adoptar una arquitectura por componentes de alta cohesión:
- **`components/home/`:** Secciones independientes de la portada (`HeroSection`, `AboutSection`, `ServicesSection`, `ProjectsSection`, `ContactSection`) y el carrusel interactivo `ProjectCarousel`.
- **`components/dashboard/common/`:** Primitivas reutilizables de administración (`StatCard`, `FilterSearchBar`, `EmptyState`, `ConfirmDeleteModal`, `UnauthorizedView`).
- **`components/dashboard/operator/`:** Componentes de soporte (`OperatorHeader`, `InquiryTable`, `InquiryDetailModal`, `InquiryReplyModal`).
- **`components/dashboard/admin/`:** Módulos de administración (`AdminHeader`, `AdminTabsNav`, `AdminOverviewTab`, `AdminProjectsTab`, `AdminServicesTab`, `AdminUsersTab`).

---

## 3. Modelo de Datos y Seguridad (RBAC)

La base de datos SQLite almacena de forma persistente cinco entidades relacionadas:

```text
    ┌──────────────┐ 1        0..* ┌────────────────────┐
    │    users     ├───────────────┤  contact_messages  │
    └──────────────┘ (ON DELETE    └────────────────────┘
                     SET NULL)
    ┌──────────────┐               ┌────────────────────┐
    │   projects   │               │      services      │
    └──────────────┘               └────────────────────┘
    ┌──────────────┐
    │ site_metrics │ (visitas_generales, accesos_autenticados)
    └──────────────┘
```

### Matriz de Roles y Permisos

| Rol | Alcance y Capacidades Principales |
|---|---|
| **Visitante** | Consulta libre de portada, servicios, vista previa de proyectos, carrusel y envío de consultas anónimas. |
| **Usuario Normal** (`usuario_normal`) | Acceso completo al catálogo de proyectos privados (`/proyectos`), detalle técnico (`/proyectos/:id`) y seguimiento en `/mis-consultas`. |
| **Operador** (`operador`) | Bandeja de consultas recibidas (`/operador`), inspección de mensajes, despacho de respuestas por correo y cambio de estado. |
| **Administrador** (`administrador`) | Control global (`/admin`): CRUD de proyectos y servicios, gestión de roles de usuarios, métricas y analíticas. |

### Salvaguardas de Integridad y Seguridad
- **Protección contra Autobloqueo:** El sistema impide programáticamente que un administrador elimine su propia cuenta o degrade/elimine al último administrador activo del sistema.
- **Integridad Referencial:** La eliminación de cuentas de usuario preserva el historial de consultas recibidas mediante la restricción `ON DELETE SET NULL`.
- **Sanitización e Inyecciones:** Consultas SQL preparadas (`prepared statements`) que bloquean cualquier vector de inyección SQL.

---

## 4. Módulos y Funcionalidades Destacadas

### 4.1. Portada Pública y Showcase Interactivo
- **Carrusel Dinámico de Proyectos (`ProjectCarousel`):** Ubicado en la cabecera, rota automáticamente cada 5 segundos entre los proyectos publicados en SQLite, ofreciendo pausa interactiva, botones de avance/retroceso e indicadores por puntos.
- **Pie de Página Profesional (`Footer`):** Diseño en 4 columnas (Identidad/Estado Localhost, Navegación, Stack Tecnológico y Conectividad REST) con halo de luz superior y botón con scroll suave hacia el inicio.

### 4.2. Bandeja Personal del Usuario (`/mis-consultas`)
- Permite a los usuarios registrados auditar el estado (`pendiente` / `respondida`) de los mensajes enviados.
- Modelo estricto de **1 consulta y 1 respuesta oficial definitiva**, asegurando una comunicación formal y directa sin hilos de discusión innecesarios.

### 4.3. Paneles de Gestión (Operador y Administrador)
- **Operador (`/operador`):** Vista de tabla para escritorio y tarjetas apiladas para móviles, filtros rápidos por estado y modal de redacción con plantillas predefinidas.
- **Administrador (`/admin`):** Métricas de tráfico en vivo (`visitas_generales`, `accesos_autenticados`), gráficos Recharts de consultas y registros, y modales CRUD con selector visual de iconos Lucide.

---

## 5. Pruebas, Calidad y Ejecución

- **Validación Automatizada:** Suite de pruebas con **69 tests empíricos** de componentes (`node tests/test-m4-components.js`) que verifican la integridad estructural, tokens de Tailwind, resiliencia ante errores de imágenes y comportamiento de diálogos modales.
- **Suite Opaque-Box E2E:** Cobertura de pruebas distribuida en 6 niveles (Tiers 0 a 5) que validan concurrencia en SQLite, invariantes de seguridad y jornadas de usuario completas.
- **Despliegue Local en Un Clic:** Scripts de arranque automatizado (`iniciar.bat` para Windows, `iniciar.sh` para Linux/macOS) que detectan la IP local de red, inicializan la base de datos y abren el navegador automáticamente.
