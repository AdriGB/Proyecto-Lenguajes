# spec.md

## 1. Descripción del proyecto

Desarrollo de un portfolio web Fullstack que permita presentar información profesional, tecnologías, servicios y proyectos, incorporando autenticación de usuarios, gestión de consultas y un panel administrativo.

El sistema se ejecutará exclusivamente en **localhost**, con fines de demostración y presentación académica.

El proyecto se desarrollará con el objetivo de alcanzar la promoción de la materia. Por lo tanto, se priorizará el cumplimiento integral de los requisitos académicos, 
incluyendo las funcionalidades avanzadas solicitadas, el panel de administración, las operaciones CRUD, la gestión de usuarios y las métricas estadísticas. 
El resultado deberá ser funcional, coherente y estar preparado para su presentación y evaluación académica.

## 2. Objetivos

- Presentar el perfil profesional y los conocimientos técnicos.
- Mostrar los servicios ofrecidos y los proyectos realizados.
- Permitir el registro e inicio de sesión de usuarios.
- Restringir el acceso a la sección de proyectos para usuarios registrados.
- Gestionar consultas recibidas mediante un formulario de contacto.
- Incorporar un panel de operador y un panel de administración.
- Visualizar estadísticas mediante gráficos e indicadores.

## 3. Tecnologías

- **Frontend:** Vite + React.
- **Estilos:** Tailwind CSS.
- **Navegación:** React Router.
- **Backend:** Node.js + Express.
- **Base de datos:** SQLite.
- **Autenticación:** JWT + bcrypt.
- **Gráficos:** Recharts.
- **Envío de correos:** Nodemailer.

## 4. Roles de usuario

El sistema contará con tres roles:

| Rol | Permisos principales |
|---|---|
| Usuario normal | Registrarse, iniciar sesión, acceder a los proyectos privados y consultar su bandeja de consultas enviadas con sus respuestas. |
| Operador | Consultar los mensajes recibidos y gestionar las respuestas a las consultas. |
| Administrador | Administrar proyectos, demos, servicios, usuarios y estadísticas. |

No se implementará un panel de perfil para que los usuarios modifiquen sus datos personales o contraseñas.

## 5. Páginas y rutas

### 5.1. Página principal — `/`

Será pública e incluirá:

- Carrusel interactivo de proyectos (`ProjectCarousel`) en la cabecera, conectado con la base de datos SQLite con rotación automática y controles manuales.
- Sección Hero con presentación profesional y botones de acción rápida.
- Información personal y descripción del perfil técnico (`AboutSection`).
- Servicios ofrecidos con iconos interactivos y detalles de alcance (`ServicesSection`).
- Vista previa de proyectos con filtros rápidos y fallback para imágenes (`ProjectsSection`).
- Formulario de contacto con validaciones y autofill de sesión (`ContactSection`).

### 5.2. Registro — `/registro`

Permitirá crear una cuenta de usuario mediante un formulario con los datos necesarios para el registro.

Se validarán los campos obligatorios y se informará al usuario si el registro fue exitoso o si ocurrió algún error.

### 5.3. Inicio de sesión — `/login`

Permitirá que los usuarios registrados ingresen al sistema.

Se validarán las credenciales y se gestionará el acceso según el rol correspondiente.

### 5.4. Proyectos — `/proyectos`

Sección disponible para usuarios registrados.

Incluirá un listado de proyectos y demostraciones, con información resumida y acceso a sus respectivos detalles.

### 5.5. Detalle de proyecto — `/proyectos/:id`

Mostrará la información completa del proyecto seleccionado, incluyendo descripción, tecnologías utilizadas, funcionalidades y enlaces o demostraciones disponibles.

### 5.6. Panel de operador — `/operador`

Estructurado mediante arquitectura modular (`components/dashboard/operator/` y `components/dashboard/common/`):

- Consultar los mensajes recibidos mediante el formulario de contacto con soporte responsive para desktop y tarjetas móviles (`InquiryTable`).
- Visualizar el detalle completo de cada consulta (`InquiryDetailModal`).
- Revisar y filtrar el estado de las consultas (`FilterSearchBar`).
- Gestionar respuestas oficiales por correo mediante Nodemailer con plantillas rápidas y fallback local (`InquiryReplyModal`).

### 5.7. Panel de administración — `/admin`

Estructurado mediante arquitectura modular (`components/dashboard/admin/` y `components/dashboard/common/`):

- Navegación por pestañas de dominio (`AdminTabsNav`).
- Métricas del sistema y gráficos estadísticos interactivos mediante Recharts (`AdminOverviewTab`).
- Gestión integral de proyectos y demostraciones con filtros y modal CRUD (`AdminProjectsTab`, `ProjectFormModal`).
- Gestión de servicios con selector visual de iconos Lucide y modal CRUD (`AdminServicesTab`, `ServiceFormModal`).
- Gestión de usuarios y asignación de roles con salvaguarda contra eliminación o degradación del último administrador (`AdminUsersTab`, `UserRoleModal`).

### 5.8. Bandeja de consultas del usuario — `/mis-consultas`

Sección disponible para usuarios autenticados.

Permitirá:

- Visualizar el historial de consultas enviadas por el usuario autenticado.
- Revisar el estado de cada mensaje (`pendiente` o `respondida`).
- Consultar la respuesta oficial y definitiva registrada por el operador.
- Modelo 1 a 1: cada consulta admite una única respuesta oficial sin hilos de discusión o réplicas posteriores.

## 6. Requisitos funcionales

### RF-01. Presentación del portfolio

El sistema deberá mostrar la información profesional, las tecnologías, los servicios y una selección de proyectos en la página principal.

### RF-02. Registro de usuarios

El sistema deberá permitir la creación de cuentas y almacenar los datos necesarios en SQLite.

### RF-03. Inicio de sesión

El sistema deberá permitir el acceso mediante credenciales válidas y reconocer el rol del usuario.

### RF-04. Acceso a proyectos

El sistema deberá permitir que los usuarios registrados consulten el listado de proyectos y sus detalles.

### RF-05. Formulario de contacto

El formulario deberá incluir:

- Nombre.
- Correo electrónico.
- Tipo de consulta.
- Mensaje.

Para usuarios que hayan iniciado sesión, el nombre y el correo podrán completarse automáticamente.

Los campos deberán validarse antes de procesar el mensaje.

### RF-06. Almacenamiento de consultas

Las consultas deberán almacenarse en SQLite para que puedan revisarse posteriormente desde el panel de operador.

### RF-07. Envío de correos

El sistema deberá permitir el envío de correos relacionados con las consultas mediante Nodemailer. La funcionalidad dependerá de la configuración de un servicio de correo.

### RF-08. Gestión de consultas

El operador deberá poder consultar los mensajes recibidos y gestionar su respuesta.

### RF-09. Administración de proyectos

El administrador deberá poder crear, consultar, modificar y eliminar proyectos y demostraciones.

### RF-10. Administración de servicios

El administrador deberá poder crear, consultar, modificar y eliminar los servicios publicados.

### RF-11. Administración de usuarios

El administrador deberá poder consultar los usuarios registrados y gestionar la información administrativa prevista para cada cuenta.

### RF-12. Métricas, contadores y gráficos

El panel administrativo deberá mostrar:
- Contador de visitas generales al sitio web.
- Contador de accesos de usuarios autenticados.
- Indicadores generales (total de usuarios registrados, proyectos publicados y consultas recibidas).
- Gráficos interactivos mediante Recharts para visualizar consultas parametrizadas (tipos de consulta más frecuentes, flujo de registros de usuarios y proporción de tráfico).

### RF-13. Navegación

La aplicación deberá permitir navegar entre las páginas mediante React Router, mostrando las secciones correspondientes al estado de sesión y al rol del usuario.

### RF-14. Bandeja de consultas para usuarios registrados

El sistema deberá permitir que los usuarios autenticados consulten sus mensajes enviados, el estado de cada consulta y la respuesta oficial registrada por el operador desde su vista personal `/mis-consultas`.

## 7. Requisitos no funcionales

- **Usabilidad:** la interfaz deberá ser clara, coherente y fácil de utilizar durante una presentación.
- **Diseño responsive:** las páginas deberán adaptarse a computadoras, tablets y dispositivos móviles.
- **Mantenibilidad:** el código deberá organizarse en componentes y módulos con responsabilidades definidas.
- **Persistencia:** los datos principales deberán conservarse en la base de datos SQLite.
- **Validación:** los formularios deberán validar los datos ingresados y mostrar mensajes comprensibles.
- **Entorno de ejecución:** el sistema deberá funcionar localmente mediante frontend y backend ejecutados en localhost.
- **Seguridad básica:** se evitará almacenar contraseñas en texto plano. Las funciones de autenticación y roles tendrán el alcance necesario para la demostración, sin requerir una infraestructura de seguridad de producción.

## 8. Alcance y exclusiones

El proyecto comprende el desarrollo y la demostración local de las funcionalidades descritas.

Quedan fuera del alcance:

- El despliegue en un servidor público o servicio de hosting.
- La configuración de infraestructura de producción.
- La implementación de medidas avanzadas de seguridad propias de un sistema productivo.
- El desarrollo de un panel de perfil para usuarios normales.
- La incorporación de funcionalidades adicionales que no estén contempladas en los requisitos.

## 9. Criterios de aceptación

El proyecto se considerará listo para la presentación cuando:

1. La página principal muestre correctamente el contenido del portfolio.
2. El registro y el inicio de sesión funcionen con datos válidos.
3. Los usuarios registrados puedan acceder a los proyectos y consultar sus detalles.
4. El formulario de contacto valide y almacene las consultas.
5. El panel de operador permita revisar las consultas y gestionar sus respuestas.
6. El panel administrativo permita gestionar proyectos, demostraciones, servicios y usuarios.
7. Las métricas y los gráficos presenten datos coherentes con la información almacenada.
8. La navegación entre las distintas páginas funcione correctamente.
9. La aplicación pueda ejecutarse en localhost sin errores que impidan su demostración.