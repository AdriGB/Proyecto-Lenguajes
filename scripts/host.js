const { spawn, exec } = require('node:child_process');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

// Ensure working directory is project root
const ROOT_DIR = path.resolve(__dirname, '..');
process.chdir(ROOT_DIR);

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Find non-internal IPv4 that is not loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        // Exclude virtual/tunnel adapters if real LAN is present
        if (!name.toLowerCase().includes('warp') && !name.toLowerCase().includes('virtual')) {
          return iface.address;
        }
      }
    }
  }
  // Fallback to any IPv4 non-internal
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

async function main() {
  console.log('\x1b[36m==============================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m       ETHER FULLSTACK - SERVIDOR HOST INICIADO               \x1b[0m');
  console.log('\x1b[36m==============================================================\x1b[0m\n');

  // 1. Check if database exists, if not seed it
  const dbPath = path.join(ROOT_DIR, 'backend', 'data', 'portfolio.sqlite');
  if (!fs.existsSync(dbPath)) {
    console.log('\x1b[33m[i] Base de datos no encontrada. Inicializando SQLite y cargando datos semilla...\x1b[0m');
    const { seedDatabase } = require('../backend/src/database/seed');
    seedDatabase();
    console.log('\x1b[32m[✓] Base de datos inicializada y sembrada correctamente.\x1b[0m\n');
  }

  const localIp = getLocalIp();

  console.log('\x1b[1m\x1b[37mACCESO AL SERVIDOR:\x1b[0m\n');
  console.log(`  💻 \x1b[32mEn esta computadora (Host):\x1b[0m`);
  console.log(`     \x1b[1m\x1b[34mhttp://localhost:5173\x1b[0m\n`);
  console.log(`  📱 \x1b[32mEn tu móvil o en otra PC (Misma red Wi-Fi):\x1b[0m`);
  console.log(`     \x1b[1m\x1b[35mhttp://${localIp}:5173\x1b[0m\n`);
  console.log('\x1b[36m--------------------------------------------------------------\x1b[0m');
  console.log('\x1b[1m\x1b[37mUSUARIOS DE PRUEBA:\x1b[0m');
  console.log('  • Admin:    admin@ejemplo.com    / admin123');
  console.log('  • Operador: operador@ejemplo.com / operador123');
  console.log('  • Usuario:  usuario@ejemplo.com  / usuario123');
  console.log('\x1b[36m==============================================================\x1b[0m\n');
  console.log('\x1b[32m[✓] Servidores iniciando...\x1b[0m');
  console.log('\x1b[33m[i] Abriendo navegador automáticamente en http://localhost:5173...\x1b[0m');
  console.log('\x1b[90m(Deja esta ventana abierta. Para apagar el servidor presiona Ctrl + C)\x1b[0m\n');

  // Automatically open browser after 2.5s
  setTimeout(() => {
    const url = 'http://localhost:5173';
    if (process.platform === 'win32') {
      exec(`start "" "${url}"`);
    } else if (process.platform === 'darwin') {
      exec(`open "${url}"`);
    } else {
      exec(`xdg-open "${url}"`);
    }
  }, 2500);

  // Run npm run dev cleanly
  const child = spawn(process.platform === 'win32' ? 'npm run dev' : 'npm run dev', {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    console.error('\x1b[31m[ERROR al iniciar servidor]:\x1b[0m', err.message);
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`\x1b[31mEl servidor finalizó con código ${code}\x1b[0m`);
    }
  });

  process.on('SIGINT', () => {
    child.kill('SIGINT');
    process.exit();
  });
}

main().catch((err) => {
  console.error('\x1b[31mError fatal:\x1b[0m', err);
});
