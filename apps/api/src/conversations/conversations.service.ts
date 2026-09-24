import { Inject, Injectable } from '@nestjs/common';
import type {
  AuthenticatedUser,
  ConversationCapabilities,
  ConversationDetail,
  ConversationMessage,
  ConversationSummary,
  ListConversationsQuery,
  PaginatedResponse,
  AuditEvent,
} from '@paula/contracts';
import { BOT_CORE_CLIENT, BotCoreClient } from './bot-core.client';
import { RealtimeDispatcher } from '../realtime/realtime.dispatcher';
import {
  AddNoteDto,
  AssignConversationDto,
  ChangeModeDto,
  CloseConversationDto,
  SendMessageDto,
  TakeConversationDto,
} from './dto';

/**
 * Orquesta la operacion de conversaciones delegando en el Bot Core.
 * No contiene logica conversacional del bot; compone, valida y calcula
 * las capabilities del usuario segun rol/estado.
 */
@Injectable()
export class ConversationsService {
  constructor(
    @Inject(BOT_CORE_CLIENT) private readonly botCore: BotCoreClient,
    private readonly realtime: RealtimeDispatcher,
  ) {}

  list(
    query: ListConversationsQuery,
  ): Promise<Omit<PaginatedResponse<ConversationSummary>, 'meta'>> {
    return this.botCore.listConversations(query);
  }

  async get(
    sessionId: string,
    user: AuthenticatedUser,
  ): Promise<ConversationDetail> {
    const detail = await this.botCore.getConversation(sessionId);
    detail.capabilities = this.computeCapabilities(detail, user);
    return detail;
  }

  getMessages(
    sessionId: string,
    before?: string,
    limit?: number,
  ): Promise<Omit<PaginatedResponse<ConversationMessage>, 'meta'>> {
    return this.botCore.getMessages(sessionId, before, limit);
  }

  getAudit(
    sessionId: string,
  ): Promise<Omit<PaginatedResponse<AuditEvent>, 'meta'>> {
    return this.botCore.getAudit(sessionId);
  }

  async take(
    sessionId: string,
    dto: TakeConversationDto,
    user: AuthenticatedUser,
  ): Promise<ConversationDetail> {
    const detail = await this.botCore.takeConversation(sessionId, dto, {
      id: user.id,
      name: user.name,
    });
    detail.capabilities = this.computeCapabilities(detail, user);
    this.realtime.emit('conversation.assigned', detail, {
      sessionId,
      aggregateVersion: detail.version,
    });
    return detail;
  }

  async assign(
    sessionId: string,
    dto: AssignConversationDto,
    user: AuthenticatedUser,
  ): Promise<ConversationDetail> {
    const detail = await this.botCore.assignConversation(sessionId, dto);
    detail.capabilities = this.computeCapabilities(detail, user);
    this.realtime.emit('conversation.assigned', detail, {
      sessionId,
      aggregateVersion: detail.version,
    });
    return detail;
  }

  async sendMessage(
    sessionId: string,
    dto: SendMessageDto,
    user: AuthenticatedUser,
  ): Promise<ConversationMessage> {
    const message = await this.botCore.sendManualMessage(sessionId, dto, {
      id: user.id,
      name: user.name,
    });
    this.realtime.emit('message.created', message, { sessionId });
    return message;
  }

  addNote(
    sessionId: string,
    dto: AddNoteDto,
    user: AuthenticatedUser,
  ): Promise<ConversationMessage> {
    return this.botCore.addNote(sessionId, dto, {
      id: user.id,
      name: user.name,
    });
  }

  async changeMode(
    sessionId: string,
    dto: ChangeModeDto,
    user: AuthenticatedUser,
  ): Promise<ConversationDetail> {
    const detail = await this.botCore.changeMode(sessionId, dto);
    detail.capabilities = this.computeCapabilities(detail, user);
    this.realtime.emit('session.mode_changed', detail, {
      sessionId,
      aggregateVersion: detail.version,
    });
    return detail;
  }

  async close(
    sessionId: string,
    dto: CloseConversationDto,
    user: AuthenticatedUser,
  ): Promise<ConversationDetail> {
    const detail = await this.botCore.closeConversation(sessionId, dto);
    detail.capabilities = this.computeCapabilities(detail, user);
    this.realtime.emit('conversation.closed', detail, {
      sessionId,
      aggregateVersion: detail.version,
    });
    return detail;
  }

  /** Traduce el segmento 'mine' a un filtro por el usuario autenticado. */
  resolveMineQuery(
    query: ListConversationsQuery,
    user: AuthenticatedUser,
  ): ListConversationsQuery {
    return { ...query, assignedTo: user.id };
  }

  private computeCapabilities(
    detail: ConversationDetail,
    user: AuthenticatedUser,
  ): ConversationCapabilities {
    const isClosed = detail.status === 'CLOSED';
    const isSupervisor = this.hasRole(user, 'PAULA_SUPERVISOR', 'PAULA_ADMIN');
    const isAssignedToMe = detail.assignedTo?.id === user.id;

    return {
      canTake: !isClosed && !detail.assignedTo,
      canSendMessage:
        !isClosed && detail.mode === 'MANUAL' && (isAssignedToMe || isSupervisor),
      canAssign: !isClosed && isSupervisor,
      canChangeMode: !isClosed && (isAssignedToMe || isSupervisor),
      canClose: !isClosed && (isAssignedToMe || isSupervisor),
      canViewTechnical: this.canViewTechnical(user),
    };
  }

  private canViewTechnical(user: AuthenticatedUser): boolean {
    return this.hasRole(user, 'PAULA_SUPERVISOR', 'PAULA_ADMIN');
  }

  private hasRole(
    user: AuthenticatedUser,
    ...roles: AuthenticatedUser['roles']
  ): boolean {
    return user.roles.some((r) => roles.includes(r));
  }
}
