import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { TokenService } from './token.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Modulo de autenticacion/autorizacion.
 * Global para que TokenService este disponible al AuthGuard registrado
 * de forma global en el bootstrap.
 */
@Global()
@Module({
  controllers: [AuthController],
  providers: [TokenService, AuthGuard, RolesGuard],
  exports: [TokenService, AuthGuard, RolesGuard],
})
export class AuthModule {}
