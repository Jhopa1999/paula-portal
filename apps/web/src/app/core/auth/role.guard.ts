import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { UserRole } from '@paula/contracts';
import { AuthService } from './auth.service';

/**
 * Restringe una ruta a ciertos roles. Uso:
 *   canActivate: [roleGuard(['PAULA_SUPERVISOR', 'PAULA_ADMIN'])]
 */
export function roleGuard(roles: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isAuthenticated() && auth.hasRole(...roles)) {
      return true;
    }
    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    return router.createUrlTree(['/app/inbox/all']);
  };
}
