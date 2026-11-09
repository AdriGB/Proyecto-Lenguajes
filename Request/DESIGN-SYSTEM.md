# design-system.md

## 1. Objetivo

Definir la identidad visual del portfolio Ether para mantener una interfaz moderna, consistente y profesional, con una estética oscura.

Se utilizará una estética oscura, con fondos negros y grises, textos claros, detalles de color y efectos sutiles. El diseño deberá adaptarse a computadoras, tablets y dispositivos móviles.

## 2. Paleta de colores

La interfaz utiliza las paletas estándar nativas de **Tailwind CSS** para un diseño oscuro moderno, sin requerir configuraciones de color personalizadas:

| Uso | Escala Tailwind | Código Hex |
|---|---|---|
| Fondo principal | `zinc-950` | `#09090B` |
| Superficies y tarjetas | `zinc-900` | `#18181B` |
| Bordes y divisores | `zinc-800` | `#27272A` |
| Bordes de enfoque | `zinc-700` | `#3F3F46` |
| Texto principal | `white` / `zinc-100` | `#FFFFFF` |
| Texto secundario | `zinc-400` | `#A1A1AA` |
| Color de acento | `sky-500` / `sky-400` | `#0EA5E9` / `#38BDF8` |
| Acento alternativo | `violet-600` / `violet-400` | `#7C3AED` / `#A78BFA` |
| Estado exitoso | `emerald-500` / `emerald-400` | `#10B981` / `#34D399` |
| Estado de error | `rose-500` / `rose-400` | `#F43F5E` / `#FB7185` |

La escala `zinc` proporciona un fondo oscuro profundo y de alto contraste. El acento `sky` destaca botones y llamadas a la acción, mientras que `violet` se utiliza para roles y detalles secundarios. Los tonos `emerald` y `rose` se reservan para estados, badges y alertas.

## 3. Tipografía

Se utilizará **Inter** como tipografía principal.

La fuente predeterminada del navegador es suficiente para un prototipo básico, pero una tipografía consistente ayudará a conseguir una presentación más cuidada. Inter ofrece una apariencia moderna y legible para interfaces web.

Jerarquía tipográfica:

- Títulos principales: 36–56 px, peso 700.
- Títulos de sección: 28–36 px, peso 600–700.
- Títulos de tarjetas: 18–22 px, peso 600.
- Texto general: 16 px, peso 400.
- Texto secundario: 14 px, peso 400.
- Botones y navegación: 14–16 px, peso 500–600.

Se priorizará la legibilidad y se evitará utilizar demasiados tamaños o pesos diferentes.

## 4. Espaciado y dimensiones
Se utilizará un sistema de espaciado consistente basado en múltiplos de 4 px.
- Espaciado pequeño: 4–8 px.
- Espaciado entre elementos: 12–16 px.
- Espaciado interno de tarjetas: 20–24 px.
- Separación entre secciones: 64–96 px.
- Ancho máximo del contenido: 1200 px.
La interfaz deberá evitar la saturación visual y mantener suficiente espacio entre elementos.

## 5. Componentes visuales
Barra de navegación
- Altura confortable de 80 px (`h-20`) para evitar aglomeración vertical de componentes.
- Logotipo estilizado con indicador animado a la izquierda (`Portfolio.Ether`).
- Enlaces de navegación interactivos con estilo píldora (`px-3.5 py-2 hover:bg-zinc-800/60`).
- Badges destacados con fondo translúcido para roles de operador (`sky`) y administrador (`violet`).
- Línea divisoria vertical de separación estructural hacia los controles de usuario.
- Cápsula de identidad de usuario con avatar circular, nombre y badge de rol.
- Menú responsivo optimizado para pantallas táctiles y dispositivos móviles.
Botones
- Botón principal azul con texto oscuro o blanco según el contraste.
- Botón secundario con fondo gris oscuro y borde sutil.
- Esquinas ligeramente redondeadas.
- Efectos hover suaves.
- Estados visuales para deshabilitado, activo y enfocado.
Tarjetas
Se utilizarán para proyectos, servicios y estadísticas.
- Fondo gris oscuro.
- Bordes sutiles.
- Radio de borde de 8–12 px.
- Espaciado interno uniforme.
- Efecto hover discreto.
- Imágenes con proporciones consistentes.
Formularios
- Campos con fondo oscuro y texto claro.
- Bordes grises.
- Etiquetas visibles.
- Indicadores claros para errores y validaciones.
- Botones de envío consistentes con el diseño general.
Carrusel de proyectos (`ProjectCarousel`)
- Ubicado en la cabecera de la página de inicio previo a la sección Hero.
- Navegación automática temporizada (5 segundos) con pausa interactiva al situar el cursor.
- Controles de navegación manual: flechas direccionales izquierda/derecha e indicadores de posición por puntos activos.
- Visualización de imagen representativa, insignia de estado ("PROYECTO DESTACADO"), título, descripción resumida y badges de tecnologías.
- Botón de acceso directo hacia el detalle del proyecto o hacia el catálogo de demostraciones.
Pie de página (`Footer`)
- Borde superior con acento luminoso sutil (`bg-gradient-to-r from-transparent via-sky-500/50 to-transparent`) y halo difuminado superior.
- Organización equilibrada en 4 columnas:
  1. *Identidad & Misión:* Logotipo animado `Portfolio.Ether`, reseña institucional y cápsula de estado del servidor en Localhost.
  2. *Navegación rápida:* Enlaces a secciones clave con icono de flecha desplazable en hover.
  3. *Stack Tecnológico:* Etiquetas unificadas de las tecnologías del proyecto (React 18, Vite, Tailwind CSS, Node.js, SQLite, Lucide, Recharts).
  4. *Conectividad:* Buzón de correo oficial (`contacto@portfolio.local`) y especificaciones del servidor REST local.
- Barra inferior con aviso de evaluación académica y botón interactivo "Subir" con scroll suave hacia el inicio (`window.scrollTo`).
- Exclusión deliberada de accesos directos al sistema para preservar la limpieza visual y canalizar la autenticación a través del Navbar.
Paneles administrativos y de operador
- Componentes compartidos (`dashboard/common`):
  - `StatCard`: tarjeta métrica con valor numérico, unidad, icono contextual y pie descriptivo.
  - `FilterSearchBar`: barra de búsqueda con borrado instantáneo y pestañas de filtrado reactivo.
  - `EmptyState`: contenedor ilustrado para listados vacíos o búsquedas sin coincidencia.
  - `ConfirmDeleteModal`: modal de alerta destructiva reutilizable con advertencia de irreversibilidad.
  - `UnauthorizedView`: pantalla estandarizada de acceso denegado (403) con opción de regreso.
- Navegación clara entre secciones y pestañas de dominio (`AdminTabsNav`).
- Tablas legibles con soporte de vista de tarjetas en pantallas móviles (`InquiryTable`, `AdminProjectsTab`, `AdminUsersTab`).
- Gráficos estadísticos coherentes con la paleta oscura mediante Recharts (`AdminOverviewTab`).
- Formularios modales con validaciones en tiempo real y selector de iconos Lucide (`ServiceFormModal`).

## 6. Fondos, bordes y efectos
- Predominarán los fondos oscuros sólidos.
- Se podrán utilizar degradados sutiles en la portada y las secciones destacadas.
- Las sombras serán discretas.
- Los brillos azules o violetas se reservarán para elementos destacados.
- No se utilizarán efectos luminosos excesivos ni animaciones que distraigan.

## 7. Iconografía
Se utilizarán iconos de Lucide React para navegación, acciones, tecnologías y elementos informativos.

Los iconos deberán mantener un tamaño y estilo consistentes. No se utilizarán emojis como sustitutos de los iconos de interfaz.
## 8. Animaciones e interacciones
- Transiciones suaves en botones, enlaces y tarjetas.
- Efectos hover discretos.
- Animaciones breves al mostrar elementos cuando aporten valor.
- Indicadores visuales de carga cuando sean necesarios.
- Respeto por la preferencia del sistema para reducir movimiento.
Las animaciones no deberán afectar la navegación ni el rendimiento.
## 9. Diseño responsive
La interfaz deberá adaptarse a diferentes tamaños de pantalla.
- Móvil: contenido en una columna, navegación compacta y botones accesibles.
- Tablet: distribución flexible con tarjetas en dos columnas cuando corresponda.
- Escritorio: uso del espacio disponible, varias columnas y paneles completos.
No deberá producirse desplazamiento horizontal innecesario.

## 10. Accesibilidad y legibilidad
- Mantener contraste suficiente entre texto y fondo.
- Utilizar etiquetas en todos los campos de formulario.
- Garantizar indicadores visibles de foco.
- Permitir la navegación mediante teclado.
- No comunicar errores o estados únicamente mediante colores.
- Mantener tamaños de texto legibles.

## 11. Reglas de implementación
- Implementar los estilos principalmente mediante Tailwind CSS.
- Reutilizar componentes para botones, tarjetas, formularios y títulos.
- Mantener la paleta y la tipografía consistentes en todas las páginas.
- Evitar estilos duplicados y valores arbitrarios innecesarios.
- No crear diseños diferentes para cada página sin una razón funcional.
- Aplicar el mismo sistema visual al portfolio público, al panel de operador y al panel de administración.
- Priorizar una presentación visual profesional, limpia y coherente con la identidad de Ether.
- Utilizar Tailwind CSS para todos los estilos de la interfaz.
- No crear archivos CSS personalizados ni escribir CSS tradicional.
- No utilizar estilos inline; priorizar las clases utilitarias de Tailwind.
- No instalar otros frameworks de estilos.

