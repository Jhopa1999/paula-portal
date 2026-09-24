import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import type { AuthenticatedUser } from '@paula/contracts';
import { DomainException } from '../common/domain.exception';
import { TokenService } from './token.service';
import { IS_PUBLIC_KEY } from './decorators';

/**
 * Guard de autenticacion. Extrae el Bearer token, lo verifica y adjunta
 * el usuario normalizado a la request. Rutas marcadas @Public() se saltan.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new DomainException(
        'AUTHENTICATION_REQUIRED',
        'Se requiere autenticacion.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = this.tokenService.verify(token);
    if (!user) {
      throw new DomainException(
        'AUTHENTICATION_REQUIRED',
        'Token invalido o expirado.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    request.user = user;
    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.header('authorization');
    if (!header) return null;
    const [type, value] = header.split(' ');
    return type === 'Bearer' && value ? value : null;
  }
}
