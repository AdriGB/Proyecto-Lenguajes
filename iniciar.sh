#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js no esta instalado en este sistema."
    echo "Por favor instala Node.js (v20+): https://nodejs.org"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[i] Instalando dependencias de Node.js por primera vez..."
    npm install
fi

node scripts/host.js
