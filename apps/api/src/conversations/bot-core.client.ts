import type {
  ConversationDetail,
  ConversationMessage,
  ConversationSummary,
  ListConversationsQuery,
  PaginatedResponse,
  TakeConversationCommand,
  AssignConversationCommand,
  SendMessageCommand,
  AddNoteCommand,
  ChangeModeCommand,
  CloseConversationCommand,
  AuditEvent,
} from '@paula/contracts';

/**
 * Contrato del cliente hacia el Bot Core (Brayan).
 * NestJS no conoce detalles de DynamoDB: solo consume esta interfaz.
 * El adapter concreto (mock o http) se inyecta por DI.
 */
export interface BotCoreClient {
  listConversations(
    query: ListConversationsQuery,
  ): Promise<Omit<PaginatedResponse<ConversationSummary>, 'meta'>>;

  getConversation(sessionId: string): Promise<ConversationDetail>;

  getMessages(
    sessionId: string,
    before?: string,
    limit?: number,
  ): Promise<Omit<PaginatedResponse<ConversationMessage>, 'meta'>>;

  getAudit(
    sessionId: string,
  ): Promise<Omit<PaginatedResponse<AuditEvent>, 'meta'>>;

  takeConversation(
    sessionId: string,
    command: TakeConversationCommand,
    actor: { id: string; name: string },
  ): Promise<ConversationDetail>;

  assignConversation(
    sessionId: string,
    command: AssignConversationCommand,
  ): Promise<ConversationDetail>;

  sendManualMessage(
    sessionId: string,
    command: SendMessageCommand,
    actor: { id: string; name: string },
  ): Promise<ConversationMessage>;

  addNote(
    sessionId: string,
    command: AddNoteCommand,
    author: { id: string; name: string },
  ): Promise<ConversationMessage>;

  changeMode(
    sessionId: string,
    command: ChangeModeCommand,
  ): Promise<ConversationDetail>;

  closeConversation(
    sessionId: string,
    command: CloseConversationCommand,
  ): Promise<ConversationDetail>;
}

/** Token de inyeccion para el BotCoreClient. */
export const BOT_CORE_CLIENT = Symbol('BOT_CORE_CLIENT');
