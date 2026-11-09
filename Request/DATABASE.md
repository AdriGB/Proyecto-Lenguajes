# database.md

## 1. Base de datos

El sistema utilizará **SQLite** como base de datos local. Se encargará de almacenar los usuarios, proyectos, servicios y consultas recibidas mediante el formulario de contacto.

La base de datos será utilizada exclusivamente por el backend.

## 2. Tabla `users`

Almacena los usuarios registrados y sus roles.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador del usuario. |
| `name` | TEXT | NOT NULL | Nombre del usuario. |
| `email` | TEXT | NOT NULL UNIQUE | Correo electrónico. |
| `password_hash` | TEXT | NOT NULL | Contraseña almacenada mediante hash. |
| `role` | TEXT | NOT NULL DEFAULT 'usuario_normal' | Rol del usuario. |
| `created_at` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | Fecha de registro. |

Roles permitidos:
- `usuario_normal`
- `operador`
- `administrador`

## 3. Tabla `projects`

Almacena los proyectos y demostraciones publicados en el portfolio.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador del proyecto. |
| `title` | TEXT | NOT NULL | Título del proyecto. |
| `description` | TEXT | NOT NULL | Descripción completa. |
| `short_description` | TEXT | NOT NULL | Descripción resumida. |
| `technologies` | TEXT | NOT NULL | Tecnologías utilizadas, almacenadas como texto o JSON. |
| `image_url` | TEXT | NULL | Ruta o URL de la imagen. |
| `demo_url` | TEXT | NULL | Enlace a la demostración. |
| `repository_url` | TEXT | NULL | Enlace al repositorio. |
| `is_published` | INTEGER | NOT NULL DEFAULT 1 | Indica si el proyecto está publicado. |
| `created_at` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | Fecha de creación. |
| `updated_at` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | Fecha de última modificación. |

Los proyectos activos (`is_published = 1`) alimentan dinámicamente el carrusel interactivo de la portada (`ProjectCarousel`) y la sección de vista previa de la página principal (`ProjectsSection`). El acceso al catálogo detallado y código fuente está protegido para usuarios autenticados en `/proyectos`.

## 4. Tabla `services`

Almacena los servicios ofrecidos en el portfolio.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador del servicio. |
| `title` | TEXT | NOT NULL | Nombre del servicio. |
| `description` | TEXT | NOT NULL | Descripción del servicio. |
| `icon` | TEXT | NULL | Nombre o referencia del icono. |
| `is_published` | INTEGER | NOT NULL DEFAULT 1 | Indica si el servicio está publicado. |
| `created_at` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | Fecha de creación. |
| `updated_at` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | Fecha de última modificación. |

## 5. Tabla `contact_messages`

Almacena los mensajes enviados desde el formulario de contacto.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador del mensaje. |
| `user_id` | INTEGER | NULL, FOREIGN KEY | Usuario registrado que envió el mensaje, si corresponde. |
| `name` | TEXT | NOT NULL | Nombre del remitente. |
| `email` | TEXT | NOT NULL | Correo del remitente. |
| `inquiry_type` | TEXT | NOT NULL | Tipo de consulta. |
| `message` | TEXT | NOT NULL | Contenido del mensaje. |
| `status` | TEXT | NOT NULL DEFAULT 'pendiente' | Estado de la consulta. |
| `response_message` | TEXT | NULL | Respuesta registrada por el operador. |
| `responded_at` | DATETIME | NULL | Fecha de respuesta. |
| `created_at` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | Fecha de recepción. |

La relación con `users` será opcional para permitir consultas de visitantes que no hayan iniciado sesión. Cuando el usuario está autenticado, `user_id` vincula la consulta para que el remitente pueda visualizar el estado y la respuesta del operador desde `/mis-consultas`.

Estados previstos:
- `pendiente`
- `respondida`

## 6. Tabla `site_metrics`

Almacena los contadores de tráfico y accesos requeridos para las analíticas del panel administrativo.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `metric_key` | TEXT | PRIMARY KEY | Identificador de la métrica (`visitas_generales`, `accesos_autenticados`). |
| `count` | INTEGER | NOT NULL DEFAULT 0 | Valor acumulado del contador. |
| `updated_at` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | Fecha de última actualización. |

Claves iniciales previstas:
- `visitas_generales`: se incrementa al cargar el sitio público.
- `accesos_autenticados`: se incrementa cada vez que un usuario registrado inicia sesión o accede a secciones protegidas.

## 7. Índices

Se crearán índices para mejorar las consultas más frecuentes:

- Índice único para `users.email`.
- Índice sobre `contact_messages.status`.
- Índice sobre `contact_messages.created_at`.
- Índice sobre `projects.is_published`.
- Índice sobre `services.is_published`.

## 8. Reglas de integridad

- El correo electrónico de cada usuario debe ser único.
- Los campos obligatorios no podrán almacenarse vacíos.
- Los roles deberán corresponder a los valores definidos.
- Los estados de las consultas deberán respetar los valores permitidos.
- La eliminación de un usuario no deberá borrar automáticamente sus consultas.
- Las claves foráneas deberán estar habilitadas en SQLite.
- Las contraseñas nunca se almacenarán en texto plano.

## 9. Métricas del panel administrativo

Las estadísticas del panel combinarán los contadores de `site_metrics` con consultas SQL de agregación (`COUNT` y `GROUP BY`) sobre las tablas principales:

- **Visitas generales (Counter):** valor de `visitas_generales` en `site_metrics`.
- **Accesos de usuarios autenticados (Counter):** valor de `accesos_autenticados` en `site_metrics`.
- **Usuarios registrados:** cantidad total de registros en `users`.
- **Proyectos y servicios publicados:** cantidad de registros activos en `projects` y `services`.
- **Consultas recibidas y pendientes:** conteo total y filtrado por estado `pendiente` en `contact_messages`.
- **Datos para gráficos (Recharts):** 
  - Consultas agrupadas por `inquiry_type` (tipos de consulta más frecuentes).
  - Usuarios agrupados por fecha de `created_at` (flujo de registros).

## 10. Inicialización y persistencia

- La base de datos se creará automáticamente si no existe.
- Las tablas se inicializarán mediante un script de configuración.
- Se podrán insertar datos de prueba para facilitar la presentación.
- Los datos deberán conservarse al reiniciar el backend.
- El archivo de la base de datos se ubicará dentro del directorio de datos del backend.

## 11. Consideraciones de implementación

El backend será responsable de realizar las operaciones CRUD y las consultas estadísticas.

Los nombres de tablas y campos definidos en este documento deberán respetarse durante la implementación para mantener la coherencia entre el backend y el frontend.

Si durante el desarrollo se necesita agregar o modificar algún campo, deberá actualizarse este documento y mantenerse la consistencia con los requisitos de `spec.md`.