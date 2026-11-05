@echo off
title Servidor Ether - Host
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado en esta computadora.
    echo Por favor descarga e instala Node.js desde: https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [i] Instalando dependencias de Node.js por primera vez...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo la instalacion de dependencias.
        pause
        exit /b 1
    )
)

node scripts\host.js
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] El servidor se detuvo con errores.
    pause
)
