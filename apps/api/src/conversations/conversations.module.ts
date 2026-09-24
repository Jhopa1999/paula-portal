import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { BOT_CORE_CLIENT } from './bot-core.client';
import { MockBotCoreAdapter } from './mock-bot-core.adapter';

/**
 * Modulo de conversaciones.
 * El BotCoreClient se provee via token. Hoy usa el adapter mock;
 * cuando exista la API real de Brayan se cambia el provider por el Http adapter
 * (idealmente segun BOT_CORE_ADAPTER en config) sin tocar controller/service.
 */
@Module({
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    { provide: BOT_CORE_CLIENT, useClass: MockBotCoreAdapter },
  ],
})
export class ConversationsModule {}
