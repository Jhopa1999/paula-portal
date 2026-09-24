import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  ConversationDetail,
  ConversationMessage,
  ConversationSummary,
  ListConversationsQuery,
  PaginatedResponse,
  TakeConversationCommand,
  AssignConversationCommand,
  SendMessageCommand,
  ChangeModeCommand,
  CloseConversationCommand,
} from '@paula/contracts';
import { v4 as uuidv4 } from 'uuid';
import { BotCoreClient } from './bot-core.client';
import { DomainException } from '../common/domain.exception';

/**
 * Adapter mock en memoria del Bot Core.
 * Permite desarrollar la Web sin depender de la API real de Brayan.
 * Reemplazable por un HttpBotCoreAdapter sin cambiar el resto del codigo.
 */
@Injectable()
export class MockBotCoreAdapter implements BotCoreClient {
  private readonly conversations = new Map<string, ConversationDetail>();
  private readonly messages = new Map<string, ConversationMessage[]>();

  constructor() {
    this.seed();
  }

  async listConversations(
    query: ListConversationsQuery,
  ): Promise<Omit<PaginatedResponse<ConversationSummary>, 'meta'>> {
    let items = Array.from(this.conversations.values());

    if (query.status) items = items.filter((c) => c.status === query.status);
    if (query.mode) items = items.filter((c) => c.mode === query.mode);
    if (query.assignedTo)
      items = items.filter((c) => c.assignedTo?.id === query.assignedTo);
    if (query.assignmentState === 'UNASSIGNED')
      items = items.filter((c) => !c.assignedTo);
    if (query.assignmentState === 'ASSIGNED')
      items = items.filter((c) => !!c.assignedTo);
    if (query.phone) items = items.filter((c) => c.phone.includes(query.phone!));
    if (query.thirdPartyId)
      items = items.filter((c) => c.thirdPartyId === query.thirdPartyId);

    items.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));

    return { data: items, pagination: {} };
  }

  async getConversation(sessionId: string): Promise<ConversationDetail> {
    const conv = this.conversations.get(sessionId);
    if (!conv) {
      throw new DomainException(
        'SESSION_NOT_FOUND',
        'La sesion no existe.',
        HttpStatus.NOT_FOUND,
      );
    }
    return conv;
  }

  async getMessages(
    sessionId: string,
  ): Promise<Omit<PaginatedResponse<ConversationMessage>, 'meta'>> {
    await this.getConversation(sessionId);
    const list = this.messages.get(sessionId) ?? [];
    return { data: list, pagination: {} };
  }

  async takeConversation(
    sessionId: string,
    command: TakeConversationCommand,
  ): Promise<ConversationDetail> {
    const conv = await this.getConversation(sessionId);
    this.assertVersion(conv, command.expectedVersion);
    if (conv.assignedTo) {
      throw new DomainException(
        'CONVERSATION_ALREADY_ASSIGNED',
        'La conversacion ya fue tomada por otro asesor.',
        HttpStatus.CONFLICT,
      );
    }
    conv.assignedTo = { id: 'usr-mock', name: 'Asesor Mock' };
    conv.mode = 'MANUAL';
    conv.version += 1;
    conv.updatedAt = new Date().toISOString();
    return conv;
  }

  async assignConversation(
    sessionId: string,
    command: AssignConversationCommand,
  ): Promise<ConversationDetail> {
    const conv = await this.getConversation(sessionId);
    this.assertVersion(conv, command.expectedVersion);
    conv.assignedTo = { id: command.assigneeId, name: command.assigneeId };
    conv.version += 1;
    conv.updatedAt = new Date().toISOString();
    return conv;
  }

  async sendManualMessage(
    sessionId: string,
    command: SendMessageCommand,
  ): Promise<ConversationMessage> {
    const conv = await this.getConversation(sessionId);
    if (conv.status === 'CLOSED') {
      throw new DomainException(
        'SESSION_CLOSED',
        'La conversacion esta cerrada.',
        HttpStatus.CONFLICT,
      );
    }
    if (conv.mode !== 'MANUAL') {
      throw new DomainException(
        'INVALID_SESSION_MODE',
        'Solo se puede enviar en modo MANUAL.',
        HttpStatus.CONFLICT,
      );
    }
    const message: ConversationMessage = {
      messageId: `MSG#${uuidv4()}`,
      sessionId,
      role: 'advisor',
      type: 'text',
      content: command.content,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'SENT',
      author: conv.assignedTo ?? { id: 'usr-mock', name: 'Asesor Mock' },
    };
    const list = this.messages.get(sessionId) ?? [];
    list.push(message);
    this.messages.set(sessionId, list);
    conv.messageCount += 1;
    conv.lastActivityAt = message.createdAt;
    conv.version += 1;
    return message;
  }

  async changeMode(
    sessionId: string,
    command: ChangeModeCommand,
  ): Promise<ConversationDetail> {
    const conv = await this.getConversation(sessionId);
    this.assertVersion(conv, command.expectedVersion);
    conv.mode = command.mode;
    conv.version += 1;
    conv.updatedAt = new Date().toISOString();
    return conv;
  }

  async closeConversation(
    sessionId: string,
    command: CloseConversationCommand,
  ): Promise<ConversationDetail> {
    const conv = await this.getConversation(sessionId);
    this.assertVersion(conv, command.expectedVersion);
    conv.status = 'CLOSED';
    conv.closeReason = 'MANUAL';
    conv.closedAt = new Date().toISOString();
    conv.version += 1;
    conv.updatedAt = conv.closedAt;
    return conv;
  }

  private assertVersion(conv: ConversationDetail, expected: number): void {
    if (conv.version !== expected) {
      throw new DomainException(
        'INVALID_COMMAND_VERSION',
        'La conversacion fue modificada por otro usuario. Refresque e intente de nuevo.',
        HttpStatus.CONFLICT,
      );
    }
  }

  private seed(): void {
    const now = new Date().toISOString();
    const c1: ConversationDetail = {
      sessionId: 'SES#MOCK0001',
      channel: 'WHATSAPP',
      phone: '+573001234567',
      contactName: 'Usuario Demo',
      thirdPartyId: '900123456',
      thirdPartyName: 'EMPRESA XYZ',
      flow: 'OPTION_3',
      mode: 'AGENT',
      status: 'ACTIVE',
      unreadCount: 2,
      createdAt: now,
      lastActivityAt: now,
      updatedAt: now,
      messageCount: 3,
      version: 1,
      lastMessage: {
        preview: 'Necesito ayuda con una factura.',
        createdAt: now,
        direction: 'INBOUND',
      },
    };
    const c2: ConversationDetail = {
      sessionId: 'SES#MOCK0002',
      channel: 'WHATSAPP',
      phone: '+573009876543',
      contactName: 'Maria Prueba',
      mode: 'MANUAL',
      status: 'ACTIVE',
      assignedTo: { id: 'usr-002', name: 'Diana' },
      unreadCount: 0,
      createdAt: now,
      lastActivityAt: now,
      updatedAt: now,
      messageCount: 2,
      version: 1,
      lastMessage: {
        preview: 'Gracias, quedo atenta.',
        createdAt: now,
        direction: 'INBOUND',
      },
    };
    this.conversations.set(c1.sessionId, c1);
    this.conversations.set(c2.sessionId, c2);
    this.messages.set(c1.sessionId, [
      {
        messageId: 'MSG#0001',
        sessionId: c1.sessionId,
        role: 'user',
        type: 'text',
        content: 'Hola, necesito ayuda con una factura.',
        createdAt: now,
      },
      {
        messageId: 'MSG#0002',
        sessionId: c1.sessionId,
        role: 'assistant',
        type: 'text',
        content: 'Con gusto. Cuenteme mas sobre la factura.',
        createdAt: now,
      },
    ]);
    this.messages.set(c2.sessionId, [
      {
        messageId: 'MSG#0003',
        sessionId: c2.sessionId,
        role: 'advisor',
        type: 'text',
        content: 'Buenas, ya estoy revisando su caso.',
        createdAt: now,
        deliveryStatus: 'DELIVERED',
        author: { id: 'usr-002', name: 'Diana' },
      },
    ]);
  }
}
