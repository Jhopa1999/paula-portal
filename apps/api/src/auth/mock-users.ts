import type { AuthenticatedUser } from '@paula/contracts';

/**
 * Usuarios de prueba para DEV (equivalen a los grupos de Cognito).
 * Cuando exista Cognito real, esta lista desaparece y la identidad
 * proviene del JWT validado.
 */
export const MOCK_USERS: Record<string, AuthenticatedUser> = {
  'usr-advisor': {
    id: 'usr-advisor',
    name: 'Ana Asesora',
    email: 'ana@paula.local',
    roles: ['PAULA_ADVISOR'],
  },
  'usr-supervisor': {
    id: 'usr-supervisor',
    name: 'Sofia Supervisora',
    email: 'sofia@paula.local',
    roles: ['PAULA_SUPERVISOR'],
  },
  'usr-admin': {
    id: 'usr-admin',
    name: 'Andres Admin',
    email: 'andres@paula.local',
    roles: ['PAULA_ADMIN'],
  },
};
