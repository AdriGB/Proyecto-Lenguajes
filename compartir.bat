@echo off
title Servidor Ether - Enlace Publico
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado en esta computadora.
    pause
    exit /b 1
)

node scripts\tunnel.js
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Ocurrio un problema con el tunel publico.
    pause
)
