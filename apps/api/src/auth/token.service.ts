import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '@paula/contracts';

/**
 * Servicio de token para DEV.
 * Codifica la identidad como un token opaco base64 ("mock.<payload>").
 * IMPORTANTE: esto NO es seguro y solo sirve para desarrollo local.
 * En produccion se reemplaza por validacion de JWT de Cognito (firma,
 * issuer, audience) sin cambiar la interfaz consumida por los guards.
 */
@Injectable()
export class TokenService {
  private static readonly PREFIX = 'mock.';

  issue(user: AuthenticatedUser): string {
    const payload = Buffer.from(JSON.stringify(user)).toString('base64url');
    return `${TokenService.PREFIX}${payload}`;
  }

  verify(token: string): AuthenticatedUser | null {
    if (!token.startsWith(TokenService.PREFIX)) {
      return null;
    }
    try {
      const raw = token.slice(TokenService.PREFIX.length);
      const json = Buffer.from(raw, 'base64url').toString('utf8');
      const parsed = JSON.parse(json) as AuthenticatedUser;
      if (!parsed.id || !Array.isArray(parsed.roles)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
