import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser, LoginResponse } from '@paula/contracts';
import { DomainException } from '../common/domain.exception';
import { TokenService } from './token.service';
import { MOCK_USERS } from './mock-users';
import { CurrentUser, Public } from './decorators';
import { MockLoginDto } from './dto';

/**
 * Controlador de autenticacion.
 * En DEV expone un login mock que emite un token portador de identidad.
 * En produccion, el login ocurre via OIDC (Cognito) y este endpoint mock
 * se deshabilita; /me sigue sirviendo para resolver la identidad del token.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly tokenService: TokenService) {}

  /** Lista los usuarios de prueba disponibles (solo DEV). */
  @Public()
  @Get('mock-users')
  mockUsers(): AuthenticatedUser[] {
    return Object.values(MOCK_USERS);
  }

  /** Login mock: recibe un userId de prueba y devuelve token + usuario. */
  @Public()
  @Post('login')
  login(@Body() dto: MockLoginDto): LoginResponse {
    const user = MOCK_USERS[dto.userId];
    if (!user) {
      throw new DomainException(
        'AUTHENTICATION_REQUIRED',
        'Usuario de prueba no valido.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return { token: this.tokenService.issue(user), user };
  }

  /** Devuelve la identidad del token actual. */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
