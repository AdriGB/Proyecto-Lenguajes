# 🚀 Ether — Portfolio Profesional Fullstack

Aplicación web fullstack desarrollada con **React 18, Vite, Tailwind CSS, Node.js, Express y SQLite**. Diseñada con arquitectura modular, control de acceso basado en roles (RBAC: Usuario, Operador y Administrador), métricas analíticas interactivas y soporte nativo para ejecución como **Servidor Host** accesible desde teléfonos móviles y otras computadoras en red local.

---

## 📋 Requisitos Previos

- **Node.js**: Versión 20.x o superior (se recomienda Node 22+ por soporte nativo de `node:sqlite`).
- **Navegador web**: Chrome, Firefox, Safari, Edge o cualquier navegador móvil moderno.
- *(Opcional para red local)*: Ambos dispositivos conectados a la **misma red Wi-Fi o red local (LAN)**.

---

## 📦 Cómo Mover o Empaquetar este Proyecto a Otra Computadora

Para llevar este proyecto a otra PC y utilizarla como Host:

1. **Copiar los archivos**: Copia toda la carpeta del proyecto a la nueva computadora (puedes comprimirla en `.zip` o usar un pendrive).
   > **Tip de empaquetado ligero**: Puedes excluir la carpeta `node_modules` para que el archivo `.zip` pese menos de **15 MB**. Al ejecutar el instalador en la otra PC, las dependencias se descargarán automáticamente.
2. **Asegurarse de tener Node.js**: En la otra PC, verifica que Node.js esté instalado abriendo una terminal y ejecutando `node -v`. Si no está instalado, descárgalo desde [nodejs.org](https://nodejs.org/).

---

## ⚡ Inicio Rápido en la Computadora Host

### Opción 1: Un Solo Clic (Recomendada para Windows)
En la carpeta raíz del proyecto, simplemente haz **doble clic** en el archivo:
👉 **`iniciar.bat`**

Este script se encarga automáticamente de:
1. Validar que Node.js esté instalado.
2. Instalar dependencias si es la primera vez que se ejecuta (`npm install`).
3. Inicializar la base de datos SQLite y cargar los datos semilla si no existen (`npm run db:seed`).
4. Detectar la dirección IP local de la computadora.
5. Iniciar tanto el backend como el frontend y mostrarte en pantalla el enlace exacto para conectarte desde tu móvil u otra PC.

*(En Linux / macOS puedes usar `./iniciar.sh` en la terminal).*

---

### Opción 2: Inicio mediante Comandos de Terminal

Si prefieres usar la consola (PowerShell, CMD o Bash):

```bash
# 1. Instalar dependencias, inicializar base de datos y compilar frontend
npm run setup

# 2. Iniciar el entorno completo de desarrollo (Frontend en 5173 + Backend en 5000)
npm run dev
```

---

## 📱 Cómo Conectarse desde un Móvil u Otra Computadora

Para ver e interactuar con el sitio desde un teléfono móvil, tablet u otra laptop conectada a tu misma red Wi-Fi:

### 1. Obtener la IP local de la PC Host
Si usaste `iniciar.bat`, la IP aparecerá escrita en la ventana. Si usas la consola:
- **Windows**: Abre CMD o PowerShell y escribe `ipconfig`. Busca la línea **Dirección IPv4** (por ejemplo: `192.168.1.45`).
- **macOS**: Abre Terminal y escribe `ipconfig getifaddr en0`.
- **Linux**: Abre Terminal y escribe `hostname -I`.

### 2. Abrir el navegador en el móvil o la otra PC
Escribe en la barra de direcciones de tu navegador móvil:

```text
http://<IP_DE_LA_PC_HOST>:5173
```
*Ejemplo:* `http://192.168.1.45:5173`

> **Nota técnica**: El servidor frontend de Vite (`host: true`) actúa como proxy inverso para todas las peticiones a la API (`/api/...`), por lo que tu móvil solo se comunica con el puerto `5173` y recibe datos del backend y la base de datos de forma completamente transparente.

---

## 🔑 Cuentas y Credenciales de Prueba

La base de datos se inicializa con los siguientes usuarios de demostración preconfigurados:

| Rol | Correo Electrónico | Contraseña | Permisos y Acceso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@portfolio.local` | `admin123` | Acceso total: Métricas analíticas con Recharts, gestión CRUD de Proyectos, Servicios y Usuarios. |
| **Operador** | `operador@portfolio.local` | `operador123` | Acceso a proyectos privados y **Panel de Operador** para triaje de consultas de contacto y respuestas por email. |
| **Usuario Normal** | `usuario@portfolio.local` | `usuario123` | Acceso al catálogo completo de proyectos privados y bandeja personal de consultas en `/mis-consultas`. |
| **Visitante** *(Sin login)* | — | — | Vista pública: Portada, habilidades, servicios ofrecidos, vista previa de proyectos y formulario de contacto. |

---

## 🛠️ Comandos Disponibles (`package.json`)

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia simultáneamente Backend (puerto 5000) y Frontend (puerto 5173) con recarga en caliente. |
| `npm run setup` | Automatiza `npm install`, migración/sembrado de base de datos y compilación del frontend. |
| `npm start` | Inicia el backend en modo producción (sirve también el frontend compilado en un solo puerto si existe `frontend/dist`). |
| `npm test` | Ejecuta las **198 pruebas automatizadas** de la API y seguridad con Node Test Runner. |
| `npm run test:e2e` | Ejecuta la suite de pruebas E2E y de ciclo de vida completo (`node tests/runner.js`). |
| `npm run db:seed` | Restaura y vuelve a sembrar la base de datos SQLite con datos iniciales limpios. |
| `npm run db:verify` | Realiza una comprobación de integridad estructural sobre el archivo SQLite. |
| `npm run build` | Genera la compilación optimizada para producción del cliente en `frontend/dist/`. |

---

## ❓ Preguntas Frecuentes y Solución de Problemas

### 1. El móvil no se conecta a `http://192.168.x.x:5173`
- **Misma red**: Verifica que el móvil esté conectado al mismo Wi-Fi y no a datos móviles 4G/5G.
- **Firewall de Windows**: Al iniciar el servidor por primera vez, Windows puede mostrar una ventana emergente del Firewall pidiendo permisos para Node.js. Asegúrate de marcar **"Redes privadas"** y pulsar **Permitir acceso**.
- **Aislamiento de AP**: Algunos routers Wi-Fi públicos o de oficina tienen activada la función "Client Isolation" o "Red de Invitados", la cual impide que los dispositivos se comuniquen entre sí. Si este es el caso, conecta ambos equipos a la red principal o utiliza un punto de acceso móvil compartido desde tu teléfono.

### 2. ¿Cómo reiniciar la base de datos desde cero?
Si realizaste modificaciones y quieres volver a tener los datos iniciales de fábrica, ejecuta:
```bash
npm run db:seed
```

### 3. Acceso desde fuera de la casa (Internet pública)
Si deseas compartir la aplicación con alguien que no esté en tu casa o red Wi-Fi, puedes usar un túnel seguro temporal:
```bash
npx cloudflared tunnel --url http://localhost:5173
```
Esto te dará un enlace público HTTPS temporal para acceder desde cualquier parte.
