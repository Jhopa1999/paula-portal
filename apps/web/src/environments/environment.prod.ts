export const environment = {
  production: true,
  // Ruta relativa: el frontend se sirve desde el mismo servidor NestJS,
  // por lo que la API y el WebSocket comparten origen (mismo host y puerto).
  apiBaseUrl: '/api/v1',
};
