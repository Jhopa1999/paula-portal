import { Inject, Injectable } from '@nestjs/common';
import type {
  ConversationDetail,
  ConversationMessage,
  ConversationSummary,
  ListConversationsQuery,
  PaginatedResponse,
} from '@paula/contracts';
import { BOT_CORE_CLIENT, BotCoreClient } from './bot-core.client';
import {
  AssignConversationDto,
  ChangeModeDto,
  CloseConversationDto,
  SendMessageDto,
  TakeConversationDto,
} from './dto';

/**
 * Orquesta la operacion de conversaciones delegando en el Bot Core.
 * No contiene logica conversacional del bot; solo compone/valida.
 */
@Injectable()
export class ConversationsService {
  constructor(
    @Inject(BOT_CORE_CLIENT) private readonly botCore: BotCoreClient,
  ) {}

  list(
    query: ListConversationsQuery,
  ): Promise<Omit<PaginatedResponse<ConversationSummary>, 'meta'>> {
    return this.botCore.listConversations(query);
  }

  get(sessionId: string): Promise<ConversationDetail> {
    return this.botCore.getConversation(sessionId);
  }

  getMessages(
    sessionId: string,
    before?: string,
    limit?: number,
  ): Promise<Omit<PaginatedResponse<ConversationMessage>, 'meta'>> {
    return this.botCore.getMessages(sessionId, before, limit);
  }

  take(sessionId: string, dto: TakeConversationDto): Promise<ConversationDetail> {
    return this.botCore.takeConversation(sessionId, dto);
  }

  assign(
    sessionId: string,
    dto: AssignConversationDto,
  ): Promise<ConversationDetail> {
    return this.botCore.assignConversation(sessionId, dto);
  }

  sendMessage(
    sessionId: string,
    dto: SendMessageDto,
  ): Promise<ConversationMessage> {
    return this.botCore.sendManualMessage(sessionId, dto);
  }

  changeMode(
    sessionId: string,
    dto: ChangeModeDto,
  ): Promise<ConversationDetail> {
    return this.botCore.changeMode(sessionId, dto);
  }

  close(
    sessionId: string,
    dto: CloseConversationDto,
  ): Promise<ConversationDetail> {
    return this.botCore.closeConversation(sessionId, dto);
  }
}
