# tasks.md

## Fase 1: Planificación y diseño

- [x] Revisar `spec.md` y `architecture.md`.
- [x] Definir la estructura inicial de carpetas y archivos.
- [x] Diseñar la interfaz general del portfolio Ether.
- [x] Definir los componentes reutilizables y los layouts.
- [x] Establecer las rutas de navegación de la aplicación.

## Fase 2: Configuración del proyecto

- [x] Crear el proyecto frontend con Vite y React.
- [x] Instalar y configurar Tailwind CSS (paletas nativas Zinc, Sky, Violet, Emerald, Rose).
- [x] Instalar y configurar React Router.
- [x] Crear el proyecto backend con Node.js y Express.
- [x] Configurar las variables de entorno.
- [x] Configurar la comunicación entre frontend y backend.
- [x] Verificar que ambos servidores funcionen en localhost.

## Fase 3: Base de datos

- [x] Configurar SQLite nativo.
- [x] Crear las tablas de acuerdo con `database.md`.
- [x] Establecer las relaciones e integridad referencial (Foreign keys habilitadas).
- [x] Implementar las funciones de acceso a los datos.
- [x] Crear datos limpios de demostración para usuarios, proyectos, servicios y consultas.
- [x] Verificar las operaciones de lectura, inserción, modificación y eliminación.
- [x] Inicializar la tabla `site_metrics` con los contadores `visitas_generales` y `accesos_autenticados`.

## Fase 4: Registro, inicio de sesión y roles

- [x] Implementar el formulario de registro.
- [x] Implementar el formulario de inicio de sesión.
- [x] Validar los datos enviados desde el frontend y el backend.
- [x] Implementar el almacenamiento de contraseñas mediante bcrypt.
- [x] Implementar la autenticación mediante JWT.
- [x] Configurar los roles `usuario_normal`, `operador` y `administrador`.
- [x] Implementar el control de acceso a las rutas según el rol (ProtectedRoute).
- [x] Probar el registro, el inicio de sesión y los permisos.

## Fase 5: Página principal del portfolio

- [x] Crear el layout principal.
- [x] Implementar la sección de presentación profesional y Hero.
- [x] Implementar la sección de tecnologías y habilidades.
- [x] Implementar la sección de servicios.
- [x] Implementar la vista previa de proyectos.
- [x] Implementar la navegación principal y enlaces ancla.
- [x] Adaptar la interfaz a computadoras, tablets y móviles.

## Fase 6: Formulario de contacto

- [x] Crear el formulario con nombre, correo, tipo de consulta y mensaje.
- [x] Completar automáticamente nombre y correo cuando el usuario haya iniciado sesión.
- [x] Implementar las validaciones del formulario.
- [x] Crear el endpoint para recibir las consultas (`POST /api/contact`).
- [x] Guardar las consultas en SQLite vinculando `user_id` cuando haya sesión activa.
- [x] Configurar Nodemailer para el envío de correos con fallback de simulación local.
- [x] Mostrar mensajes de éxito y error.
- [x] Probar el flujo completo de envío y almacenamiento.

## Fase 6.1: Bandeja de consultas del usuario autenticado

- [x] Crear el endpoint `GET /api/contact/my-inquiries` protegido con JWT.
- [x] Crear la página `/mis-consultas` ([MyInquiries.jsx]) protegida para usuarios autenticados.
- [x] Visualizar el estado de cada consulta enviada (`pendiente` o `respondida`).
- [x] Mostrar la respuesta oficial registrada por el operador.
- [x] Implementar el modelo estricto de 1 consulta y 1 respuesta oficial (solo lectura, sin comentarios recursivos).
- [x] Incorporar filtros rápidos por estado (Todas, Pendientes, Respondidas).
- [x] Agregar el acceso directo en Navbar y menú móvil cuando la sesión esté iniciada.

## Fase 6.2: Estandarización visual y Tailwind CSS nativo

- [x] Migrar todos los componentes de estilos propietarios a la paleta estándar de Tailwind CSS (`zinc`, `sky`, `violet`, `emerald`, `rose`).
- [x] Limpiar `tailwind.config.js` y `index.css` eliminando tokens no estándar.
- [x] Rediseñar la barra de navegación ([Navbar.jsx]): altura espaciosa de 80 px (`h-20`), navegación estilo píldora, divisores y cápsula de usuario.
- [x] Recompilar los assets de producción de Vite (`dist/`).

## Fase 7: Sección de proyectos y demostraciones

- [x] Crear la página `/proyectos`.
- [x] Mostrar los proyectos almacenados en SQLite con búsqueda y filtrado por tecnologías.
- [x] Crear la página de detalle `/proyectos/:id`.
- [x] Mostrar la descripción, tecnologías y demostraciones disponibles.
- [x] Implementar la navegación entre listado y detalle.
- [x] Verificar el acceso exclusivo para usuarios registrados.

## Fase 8: Panel de operador

- [x] Crear la página `/operador`.
- [x] Mostrar las consultas almacenadas en SQLite.
- [x] Permitir consultar el detalle de cada mensaje.
- [x] Implementar la visualización del estado de las consultas.
- [x] Implementar la gestión de respuestas por correo / despacho local.
- [x] Restringir el acceso al rol de operador y al administrador cuando corresponda.
- [x] Probar la gestión completa de consultas.

## Fase 9: Panel de administración

- [x] Crear la página `/admin`.
- [x] Implementar el listado de proyectos y demostraciones.
- [x] Implementar el alta, modificación y eliminación de proyectos (CRUD).
- [x] Implementar el listado y la gestión de servicios (CRUD).
- [x] Implementar el alta, modificación y eliminación de servicios.
- [x] Implementar la consulta y gestión administrativa de usuarios (cambio de roles y prevención de bloqueo de administrador).
- [x] Crear el endpoint para incrementar y consultar `visitas_generales` y sumar `accesos_autenticados` al iniciar sesión.
- [x] Implementar las tarjetas de contadores (visitas generales, accesos autenticados, usuarios, proyectos y consultas).
- [x] Crear los gráficos en Recharts (consultas por tipo y flujo de registros).
- [x] Verificar que las operaciones administrativas funcionen correctamente.

## Fase 10: Pruebas y correcciones

- [x] Probar el registro y el inicio de sesión.
- [x] Probar los permisos de cada rol.
- [x] Probar la navegación entre todas las páginas.
- [x] Probar el formulario de contacto y el almacenamiento de consultas.
- [x] Probar el envío de correos con la configuración disponible.
- [x] Probar las operaciones CRUD de proyectos y servicios.
- [x] Probar la gestión administrativa de usuarios.
- [x] Verificar que las métricas y los gráficos muestren datos coherentes.
- [x] Corregir errores funcionales y visuales.
- [x] Comprobar el diseño responsive en desktop, tablet y móvil.
- [x] Verificar que los datos persistan al reiniciar la aplicación.

## Fase 11: Preparación de la presentación

- [x] Sanear la base de datos eliminando registros masivos de pruebas (dejando 3 usuarios clave, 4 proyectos showcase y 5 consultas ejemplo).
- [x] Reiniciar contadores de métricas de tráfico a 0 para demostración en vivo.
- [x] Verificar que frontend y backend puedan iniciarse correctamente (vía `iniciar.bat`, `./iniciar.sh` o `npm run dev`).
- [x] Comprobar el funcionamiento de las funcionalidades principales.
- [x] Revisar la interfaz y corregir detalles visuales pendientes.
- [x] Actualizar la documentación y el changelog.
- [x] Confirmar que el proyecto esté listo para presentarse en localhost.
