/**
 * ecosystem.config.js — Configuración PM2 para YourCourse
 * Ejecutar con: pm2 start ecosystem.config.js
 * Guardar lista: pm2 save
 * Arranque automático con Windows: pm2-windows-startup install
 */

module.exports = {
  apps: [
    {
      name: 'yourcourse-backend',
      script: 'src/index.js',
      cwd: 'C:/Users/100019201/.gemini/antigravity/scratch/Plataforma-de-aprendizaje/YourCourse/backend',
      watch: false,
      restart_delay: 3000,
      max_restarts: 20,
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
    },
    {
      name: 'yourcourse-frontend',
      script: 'start-dev.js',
      cwd: 'C:/Users/100019201/.gemini/antigravity/scratch/Plataforma-de-aprendizaje/YourCourse/frontend',
      watch: false,
      restart_delay: 3000,
      max_restarts: 20,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
