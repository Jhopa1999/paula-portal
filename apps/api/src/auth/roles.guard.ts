import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser, UserRole } from '@paula/contracts';
import { DomainException } from '../common/domain.exception';
import { ROLES_KEY } from './decorators';

/**
 * Autoriza segun los roles declarados con @Roles(). Si no hay roles
 * declarados, permite el paso (basta con estar autenticado).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    const allowed =
      !!user && user.roles.some((role) => required.includes(role));

    if (!allowed) {
      throw new DomainException(
        'FORBIDDEN_ACTION',
        'No tiene permiso para realizar esta accion.',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
