import type { UserRole } from './enums.js';

/**
 * Identidad normalizada del usuario autenticado.
 * El backend consume este tipo, no claims especificos de Cognito.
 */
export interface AuthenticatedUser {
  id: string;
  name: string;
  email?: string;
  roles: UserRole[];
}

/** Respuesta del endpoint de login (DEV/mock). */
export interface LoginResponse {
  token: string;
  user: AuthenticatedUser;
}

/** Request de login mock (solo DEV). Cognito reemplaza esto por OIDC. */
export interface MockLoginRequest {
  userId: string;
}
