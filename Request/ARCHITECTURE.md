# architecture.md

## 1. Arquitectura general

El proyecto utilizará una arquitectura cliente-servidor, dividida en tres componentes principales:

- **Frontend:** interfaz gráfica con la que interactúa el usuario.
- **Backend:** lógica de negocio, procesamiento de solicitudes y comunicación con la base de datos.
- **Base de datos:** almacenamiento persistente de usuarios, proyectos, servicios y consultas.

La aplicación funcionará exclusivamente en un entorno local (`localhost`).

## 2. Tecnologías

| Componente | Tecnología |
|---|---|
| Frontend | Vite + React |
| Estilos | Tailwind CSS |
| Navegación | React Router |
| Backend | Node.js + Express |
| Base de datos | SQLite |
| Autenticación | JWT + bcrypt |
| Gráficos | Recharts |
| Envío de correos | Nodemailer |

## 3. Estructura del proyecto

El proyecto se organizará en dos directorios principales:

```text
portfolio/
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── home/
│       │   │   ├── HeroSection.jsx
│       │   │   ├── AboutSection.jsx
│       │   │   ├── ServicesSection.jsx
│       │   │   ├── ProjectsSection.jsx
│       │   │   ├── ContactSection.jsx
│       │   │   ├── ProjectCarousel.jsx
│       │   │   └── index.js
│       │   ├── dashboard/
│       │   │   ├── common/
│       │   │   │   ├── StatCard.jsx
│       │   │   │   ├── FilterSearchBar.jsx
│       │   │   │   ├── EmptyState.jsx
│       │   │   │   ├── ConfirmDeleteModal.jsx
│       │   │   │   ├── UnauthorizedView.jsx
│       │   │   │   └── index.js
│       │   │   ├── operator/
│       │   │   │   ├── OperatorHeader.jsx
│       │   │   │   ├── InquiryTable.jsx
│       │   │   │   ├── InquiryDetailModal.jsx
│       │   │   │   ├── InquiryReplyModal.jsx
│       │   │   │   └── index.js
│       │   │   └── admin/
│       │   │       ├── AdminHeader.jsx
│       │   │       ├── AdminTabsNav.jsx
│       │   │       ├── AdminOverviewTab.jsx
│       │   │       ├── AdminProjectsTab.jsx
│       │   │       ├── ProjectFormModal.jsx
│       │   │       ├── AdminServicesTab.jsx
│       │   │       ├── ServiceFormModal.jsx
│       │   │       ├── AdminUsersTab.jsx
│       │   │       ├── UserRoleModal.jsx
│       │   │       └── index.js
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   ├── Button.jsx
│       │   ├── Card.jsx
│       │   ├── Badge.jsx
│       │   ├── Input.jsx
│       │   ├── Textarea.jsx
│       │   ├── Modal.jsx
│       │   ├── Alert.jsx
│       │   └── IconResolver.jsx
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       ├── hooks/
│       ├── context/
│       └── App.jsx
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── database/
│   │   ├── utils/
│   │   └── app.js
│   ├── data/
│   └── server.js
│
├── docs/
├── Request/
├── .env.example
├── .gitignore
└── README.md
```

La estructura podrá ajustarse durante el desarrollo si resulta necesario, manteniendo separadas las responsabilidades del frontend y el backend.

## 4. Frontend

El frontend se desarrollará con React y Vite.

Sus responsabilidades serán:

- Mostrar las páginas públicas y privadas.
- Gestionar la navegación mediante React Router.
- Implementar formularios de registro, inicio de sesión y contacto.
- Mostrar proyectos, servicios y sus detalles.
- Presentar los paneles de operador y administrador.
- Proveer la bandeja personal de consultas (`/mis-consultas`) para que los usuarios autenticados consulten sus respuestas.
- Mostrar métricas y gráficos con Recharts.
- Comunicarse con el backend mediante solicitudes HTTP.

Tailwind CSS se utilizará para construir una interfaz consistente y adaptable a distintos tamaños de pantalla.

La organización de la interfaz se basa en componentes modulares reutilizables, layouts y páginas independientes orquestadoras:

- **Módulo Home (`components/home/`):** Desacopla la página de inicio en secciones autónomas (`HeroSection`, `AboutSection`, `ServicesSection`, `ProjectsSection`, `ContactSection`) e incluye un carrusel dinámico interactivo (`ProjectCarousel`) que consume los proyectos activos directamente desde la API.
- **Módulo Dashboard (`components/dashboard/`):**
  - `common/`: Componentes genéricos compartidos por los paneles de gestión (`StatCard`, `FilterSearchBar`, `EmptyState`, `ConfirmDeleteModal`, `UnauthorizedView`).
  - `operator/`: Componentes especializados para la atención de consultas (`OperatorHeader`, `InquiryTable`, `InquiryDetailModal`, `InquiryReplyModal`).
  - `admin/`: Componentes para la administración global (`AdminHeader`, `AdminTabsNav`, `AdminOverviewTab`, `AdminProjectsTab`, `ProjectFormModal`, `AdminServicesTab`, `ServiceFormModal`, `AdminUsersTab`, `UserRoleModal`).
- **Páginas orquestadoras (`pages/`):** `OperatorDashboard.jsx` y `AdminDashboard.jsx` operan como controladores de estado y flujos de datos puros, delegando la presentación visual en los subcomponentes del dashboard.

## 5. Backend

El backend se desarrollará con Node.js y Express.

Sus responsabilidades serán:

- Procesar las solicitudes del frontend.
- Gestionar el registro y el inicio de sesión.
- Aplicar las reglas de negocio.
- Consultar y modificar los datos almacenados.
- Gestionar las consultas del formulario de contacto y servir el historial de consultas del usuario autenticado (`/api/contact/my-inquiries`).
- Administrar proyectos, servicios y usuarios.
- Proporcionar los datos necesarios para las métricas.
- Coordinar el envío de correos mediante Nodemailer.

Las rutas recibirán las solicitudes, los controladores coordinarán su procesamiento y los servicios contendrán la lógica de negocio cuando corresponda.

## 6. Base de datos

Se utilizará SQLite como sistema de base de datos local.

La base de datos almacenará, como mínimo, la información correspondiente a:

- Usuarios y sus roles.
- Proyectos y demostraciones.
- Servicios publicados.
- Consultas recibidas mediante el formulario de contacto.
- Información necesaria para las métricas del panel administrativo.

El acceso a los datos se realizará desde el backend. La definición detallada de las tablas, los campos, las relaciones y las restricciones se especificará en `database.md`.

## 7. Comunicación entre componentes

La comunicación seguirá este flujo:

1. El usuario interactúa con una página de React.
2. El frontend envía una solicitud HTTP al backend de Express.
3. El backend valida los datos y ejecuta la lógica correspondiente.
4. Cuando es necesario, consulta o modifica la base de datos SQLite.
5. El backend devuelve una respuesta.
6. El frontend actualiza la interfaz con el resultado.

El frontend no accederá directamente al archivo de la base de datos.

## 8. Autenticación y roles

La autenticación se implementará con JWT y bcrypt.

- bcrypt se utilizará para almacenar contraseñas mediante hashes.
- JWT permitirá representar la sesión autenticada.
- Los roles serán `usuario_normal`, `operador` y `administrador`.
- El frontend adaptará la navegación a la sesión y al rol.
- El backend comprobará los permisos necesarios para las operaciones administrativas y de operador.

La implementación tendrá un alcance básico, adecuado para la demostración local. No se contempla una infraestructura de seguridad de producción.

## 9. Envío de correos

Nodemailer se utilizará para gestionar los correos relacionados con las consultas de contacto.

La configuración del servicio de correo se realizará mediante variables de entorno. Si el servicio externo no está configurado, la aplicación deberá informar el error sin interrumpir innecesariamente el resto del sistema.

## 10. Métricas y gráficos

El backend proporcionará los datos necesarios para las estadísticas del panel administrativo.

El frontend utilizará Recharts para representar indicadores mediante gráficos.

Las métricas contemplarán contadores persistentes de tráfico (visitas generales y accesos de usuarios autenticados), además de cantidades de usuarios registrados, proyectos publicados y consultas recibidas agrupadas por tipo y fecha. Los valores se obtendrán y actualizarán en SQLite mediante endpoints dedicados.

## 11. Configuración y ejecución local

El proyecto se ejecutará mediante dos procesos independientes:

- Servidor de desarrollo del frontend con Vite.
- Servidor backend con Node.js y Express.

Ambos funcionarán en localhost y utilizarán la configuración definida para el entorno local.

Las variables de entorno se utilizarán para almacenar la configuración necesaria, como el puerto del servidor y los datos de conexión del servicio de correo.

El archivo `.env.example` documentará las variables requeridas sin incluir credenciales reales.

## 12. Principios de diseño

- Separación entre frontend, backend y base de datos.
- Componentes reutilizables en React.
- Responsabilidades claramente definidas en el backend.
- Persistencia local mediante SQLite.
- Código organizado y fácil de mantener.
- Configuración sencilla para ejecutar y presentar el proyecto.
- Evitar dependencias e infraestructura innecesarias para el alcance académico.