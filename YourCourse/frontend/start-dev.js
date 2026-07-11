/**
 * start-dev.js — Script de arranque para el servidor Vite en modo desarrollo.
 * Usado por PM2 para mantener el frontend siempre activo.
 */
const { spawn } = require('child_process');
const path = require('path');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const child = spawn(npmCmd, ['run', 'dev', '--', '--port', '5173', '--host', '0.0.0.0'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code) => {
  console.log(`Vite exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
