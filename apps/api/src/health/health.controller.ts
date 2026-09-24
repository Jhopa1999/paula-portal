import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  /** Liveness: el proceso responde. */
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  /**
   * Readiness: dependencias criticas del portal.
   * En Fase 0 no hay dependencias externas obligatorias (adapter mock),
   * asi que responde ready. Se ampliara cuando exista la API real.
   */
  @Get('ready')
  ready() {
    return { status: 'ready', checks: { botCore: 'mock' } };
  }
}
