import { Global, Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeDispatcher } from './realtime.dispatcher';

/**
 * Modulo realtime. Global para que cualquier servicio pueda inyectar
 * el RealtimeDispatcher y emitir eventos.
 */
@Global()
@Module({
  providers: [RealtimeGateway, RealtimeDispatcher],
  exports: [RealtimeDispatcher],
})
export class RealtimeModule {}
