@echo off
REM ============================================================
REM  YourCourse — Arranque Automático de Servidores
REM  Este archivo ya está en la carpeta de inicio de Windows.
REM  Se ejecuta automáticamente cada vez que inicias sesión.
REM ============================================================

echo [YourCourse] Liberando puertos 3000 y 5173...

REM Liberar puerto 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do (
    taskkill /PID %%a /F >nul 2>&1
)

REM Liberar puerto 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 "') do (
    taskkill /PID %%a /F >nul 2>&1
)

ping -n 3 127.0.0.1 >nul

echo [YourCourse] Iniciando Backend en puerto 3000...
start /D "C:\Users\100019201\.gemini\antigravity\scratch\Plataforma-de-aprendizaje\YourCourse\backend" "" "C:\Program Files\nodejs\node.exe" src/index.js

ping -n 6 127.0.0.1 >nul

echo [YourCourse] Iniciando Frontend en puerto 5173...
start /D "C:\Users\100019201\.gemini\antigravity\scratch\Plataforma-de-aprendizaje\YourCourse\frontend" "" "C:\Program Files\nodejs\npm.cmd" run dev -- --port 5173

echo [YourCourse] Servidores iniciados.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000

exit
