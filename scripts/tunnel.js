const { spawn, execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const cloudflaredPath = path.join(__dirname, 'cloudflared.exe');

if (!fs.existsSync(cloudflaredPath)) {
  console.log('\x1b[33m[i] Descargando cliente de túnel seguro (cloudflared)...\x1b[0m');
  try {
    execSync(`curl.exe -L -o "${cloudflaredPath}" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe`, {
      stdio: 'inherit'
    });
    console.log('\x1b[32m[✓] Cliente de túnel descargado correctamente.\x1b[0m\n');
  } catch (err) {
    console.error('\x1b[31m[ERROR] No se pudo descargar cloudflared automáticamente:\x1b[0m', err.message);
    process.exit(1);
  }
}

console.log('\x1b[36m==============================================================\x1b[0m');
console.log('\x1b[1m\x1b[32m       ETHER FULLSTACK - TUNEL PÚBLICO (ACCESO EXTERNO)       \x1b[0m');
console.log('\x1b[36m==============================================================\x1b[0m\n');
console.log('\x1b[33m[i] Conectando con la red segura de Cloudflare...\x1b[0m\n');

const child = spawn(cloudflaredPath, ['tunnel', '--url', 'http://localhost:5173'], {
  cwd: ROOT_DIR,
  stdio: ['ignore', 'pipe', 'pipe']
});

let urlFound = false;

async function handleOutput(data) {
  const text = data.toString();
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !urlFound) {
    urlFound = true;
    const publicUrl = match[0];
    
    console.log('\x1b[32m[✓] ¡Túnel establecido con éxito!\x1b[0m\n');
    console.log('  🌐 \x1b[1m\x1b[34mEnlace público para cualquier persona fuera de tu red:\x1b[0m');
    console.log(`     \x1b[1m\x1b[35m${publicUrl}\x1b[0m\n`);

    try {
      const QRCode = require('qrcode');
      const qrTerminal = await QRCode.toString(publicUrl, { type: 'terminal', small: true });
      console.log('  \x1b[33m[QR] Escanea este código para entrar desde cualquier lugar:\x1b[0m');
      console.log(qrTerminal);
    } catch (_) {}

    console.log('\x1b[36m--------------------------------------------------------------\x1b[0m');
    console.log('\x1b[1m\x1b[37mCUENTAS DE PRUEBA:\x1b[0m');
    console.log('  • Admin:    admin@portfolio.local    / admin123');
    console.log('  • Operador: operador@portfolio.local / operador123');
    console.log('  • Usuario:  usuario@portfolio.local  / usuario123');
    console.log('\x1b[36m==============================================================\x1b[0m\n');
    console.log('\x1b[90m(Mantén esta ventana abierta mientras quieras dar acceso externo. Presiona Ctrl + C para detener)\x1b[0m\n');
  }
}

child.stdout.on('data', handleOutput);
child.stderr.on('data', handleOutput);

child.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`\x1b[31mEl túnel se cerró con código ${code}\x1b[0m`);
  }
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit();
});
