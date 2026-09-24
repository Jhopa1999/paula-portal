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
  ConversationCapabilities,
} from '@paula/contracts';
import { v4 as uuidv4 } from 'uuid';
import { BotCoreClient } from './bot-core.client';
import { DomainException } from '../common/domain.exception';

/** Capabilities por defecto; el service las recalcula segun el rol. */
const DEFAULT_CAPABILITIES: ConversationCapabilities = {
  canTake: false,
  canSendMessage: false,
  canAssign: false,
  canChangeMode: false,
  canClose: false,
  canViewTechnical: false,
};

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
    if (query.flow) items = items.filter((c) => c.flow === query.flow);
    if (query.phone) items = items.filter((c) => c.phone.includes(query.phone!));
    if (query.thirdPartyId)
      items = items.filter((c) => c.thirdPartyId === query.thirdPartyId);

    // Orden por actividad mas reciente.
    items.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));

    // Paginacion cursor simple: el cursor es el indice de inicio.
    const limit = query.limit && query.limit > 0 ? query.limit : 30;
    const start = query.cursor ? Number(query.cursor) : 0;
    const page = items.slice(start, start + limit);
    const nextIndex = start + limit;
    const nextCursor = nextIndex < items.length ? String(nextIndex) : undefined;

    const summaries: ConversationSummary[] = page.map((c) => this.toSummary(c));
    return { data: summaries, pagination: { nextCursor } };
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
    this.bump(conv);
    return conv;
  }

  async assignConversation(
    sessionId: string,
    command: AssignConversationCommand,
  ): Promise<ConversationDetail> {
    const conv = await this.getConversation(sessionId);
    this.assertVersion(conv, command.expectedVersion);
    conv.assignedTo = { id: command.assigneeId, name: command.assigneeId };
    this.bump(conv);
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
    conv.session.messageCount = conv.messageCount;
    conv.lastActivityAt = message.createdAt;
    conv.session.lastActivityAt = message.createdAt;
    conv.lastMessage = {
      preview: command.content,
      createdAt: message.createdAt,
      direction: 'OUTBOUND',
    };
    this.bump(conv);
    return message;
  }

  async changeMode(
    sessionId: string,
    command: ChangeModeCommand,
  ): Promise<ConversationDetail> {
    const conv = await this.getConversation(sessionId);
    this.assertVersion(conv, command.expectedVersion);
    conv.mode = command.mode;
    this.bump(conv);
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
    conv.session.closedAt = conv.closedAt;
    conv.session.closeReason = 'MANUAL';
    this.bump(conv);
    return conv;
  }

  private toSummary(c: ConversationDetail): ConversationSummary {
    return {
      sessionId: c.sessionId,
      channel: c.channel,
      phone: c.phone,
      contactName: c.contactName,
      thirdPartyId: c.thirdPartyId,
      thirdPartyName: c.thirdPartyName,
      flow: c.flow,
      mode: c.mode,
      status: c.status,
      assignedTo: c.assignedTo,
      lastMessage: c.lastMessage,
      unreadCount: c.unreadCount,
      createdAt: c.createdAt,
      lastActivityAt: c.lastActivityAt,
      version: c.version,
    };
  }

  private bump(conv: ConversationDetail): void {
    conv.version += 1;
    conv.session.version = conv.version;
    conv.updatedAt = new Date().toISOString();
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
    const base = Date.now();
    const iso = (offsetMin: number) =>
      new Date(base - offsetMin * 60_000).toISOString();

    const make = (
      partial: Pick<
        ConversationDetail,
        | 'sessionId'
        | 'phone'
        | 'contactName'
        | 'mode'
        | 'status'
        | 'unreadCount'
      > &
        Partial<ConversationDetail> & { identification?: string },
      activityOffsetMin: number,
    ): ConversationDetail => {
      const createdAt = iso(activityOffsetMin + 30);
      const lastActivityAt = iso(activityOffsetMin);
      return {
        channel: 'WHATSAPP',
        flow: partial.flow,
        thirdPartyId: partial.thirdPartyId,
        thirdPartyName: partial.thirdPartyName,
        assignedTo: partial.assignedTo,
        lastMessage: partial.lastMessage,
        createdAt,
        lastActivityAt,
        updatedAt: lastActivityAt,
        messageCount: partial.messageCount ?? 1,
        version: 1,
        contact: {
          name: partial.contactName,
          phone: partial.phone,
          identification: partial.identification,
        },
        session: {
          createdAt,
          lastActivityAt,
          messageCount: partial.messageCount ?? 1,
          version: 1,
        },
        capabilities: { ...DEFAULT_CAPABILITIES },
        ...partial,
      };
    };

    const seedData: ConversationDetail[] = [
      make(
        {
          sessionId: 'SES#MOCK0001',
          phone: '+573001234567',
          contactName: 'Juan Perez',
          identification: '900123456',
          thirdPartyId: '900123456',
          thirdPartyName: 'EMPRESA XYZ',
          flow: 'OPTION_3',
          mode: 'AGENT',
          status: 'ACTIVE',
          unreadCount: 2,
          messageCount: 3,
          lastMessage: {
            preview: 'Necesito ayuda con una factura.',
            createdAt: iso(2),
            direction: 'INBOUND',
          },
        },
        2,
      ),
      make(
        {
          sessionId: 'SES#MOCK0002',
          phone: '+573009876543',
          contactName: 'Maria Prueba',
          mode: 'MANUAL',
          status: 'ACTIVE',
          assignedTo: { id: 'usr-advisor', name: 'Ana Asesora' },
          unreadCount: 0,
          messageCount: 2,
          flow: 'OPTION_1',
          lastMessage: {
            preview: 'Gracias, quedo atenta.',
            createdAt: iso(8),
            direction: 'INBOUND',
          },
        },
        8,
      ),
      make(
        {
          sessionId: 'SES#MOCK0003',
          phone: '+573005550001',
          contactName: 'Carlos Mora',
          mode: 'AUTOMATIC',
          status: 'PENDING_TIMEOUT',
          unreadCount: 1,
          messageCount: 4,
          flow: 'MENU',
          lastMessage: {
            preview: '1',
            createdAt: iso(15),
            direction: 'INBOUND',
          },
        },
        15,
      ),
      make(
        {
          sessionId: 'SES#MOCK0004',
          phone: '+573007778899',
          contactName: 'Lucia Gomez',
          mode: 'MANUAL',
          status: 'CLOSED',
          assignedTo: { id: 'usr-advisor', name: 'Ana Asesora' },
          unreadCount: 0,
          messageCount: 6,
          flow: 'OPTION_3',
          lastMessage: {
            preview: 'Conversacion cerrada.',
            createdAt: iso(120),
            direction: 'OUTBOUND',
          },
        },
        120,
      ),
      make(
        {
          sessionId: 'SES#MOCK0005',
          phone: '+573002223344',
          contactName: 'Pedro Nel',
          mode: 'AGENT',
          status: 'ERROR',
          unreadCount: 0,
          messageCount: 2,
          flow: 'OPTION_2',
          lastMessage: {
            preview: 'Error controlado en el flujo.',
            createdAt: iso(40),
            direction: 'OUTBOUND',
          },
        },
        40,
      ),
    ];

    for (const conv of seedData) {
      if (conv.closeReason) {
        conv.session.closeReason = conv.closeReason;
      }
      this.conversations.set(conv.sessionId, conv);
    }

    this.messages.set('SES#MOCK0001', [
      {
        messageId: 'MSG#0001',
        sessionId: 'SES#MOCK0001',
        role: 'user',
        type: 'text',
        content: 'Hola, necesito ayuda con una factura.',
        createdAt: iso(30),
      },
      {
        messageId: 'MSG#0002',
        sessionId: 'SES#MOCK0001',
        role: 'assistant',
        type: 'text',
        content: 'Con gusto. Cuenteme mas sobre la factura.',
        createdAt: iso(28),
      },
    ]);
    this.messages.set('SES#MOCK0002', [
      {
        messageId: 'MSG#0003',
        sessionId: 'SES#MOCK0002',
        role: 'advisor',
        type: 'text',
        content: 'Buenas, ya estoy revisando su caso.',
        createdAt: iso(10),
        deliveryStatus: 'DELIVERED',
        author: { id: 'usr-advisor', name: 'Ana Asesora' },
      },
    ]);
  }
}
