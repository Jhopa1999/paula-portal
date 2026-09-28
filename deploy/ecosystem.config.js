// Configuracion de PM2 para el backend NestJS del portal Paula.
// El backend sirve tambien el frontend Angular compilado (origen unico).
// Uso en el servidor (desde la raiz del repo):
//   pm2 start deploy/ecosystem.config.js
//   pm2 save          # persiste la lista de procesos
//   pm2 startup       # arranque en boot (en Windows usa pm2-windows-startup)
const { join } = require('node:path');

module.exports = {
  apps: [
    {
      name: 'paula-api',
      // Ejecuta el bundle compilado por `npm run build:api`.
      script: join(__dirname, '..', 'apps', 'api', 'dist', 'main.js'),
      cwd: join(__dirname, '..'),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        API_PORT: '3000',
        API_HOST: '0.0.0.0',
        // Con origen unico frontend y API comparten host/puerto.
        // Ajusta la IP si cambia la del servidor.
        CORS_ORIGIN: 'http://10.125.17.27:3000',
        BOT_CORE_ADAPTER: 'mock',
      },
    },
  ],
};
