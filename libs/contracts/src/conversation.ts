import type {
  ConversationMode,
  ConversationStatus,
  MessageDirection,
  CloseReason,
} from './enums.js';

/** Referencia minima a un usuario/asesor. */
export interface UserRef {
  id: string;
  name: string;
}

/** Vista corta del ultimo mensaje, para la bandeja. */
export interface LastMessagePreview {
  preview: string;
  createdAt: string;
  direction: MessageDirection;
}

/**
 * Resumen de conversacion para la bandeja (inbox).
 * Corresponde al DTO ConversationSummary del design 00-foundation.
 */
export interface ConversationSummary {
  sessionId: string;
  channel: 'WHATSAPP';

  phone: string;
  contactName?: string;

  thirdPartyId?: string;
  thirdPartyName?: string;

  flow?: string;

  mode: ConversationMode;
  status: ConversationStatus;

  assignedTo?: UserRef;

  lastMessage?: LastMessagePreview;

  unreadCount: number;

  createdAt: string;
  lastActivityAt: string;

  /** Optimistic concurrency: version esperada para comandos. */
  version: number;
}

/**
 * Detalle completo de una conversacion/sesion.
 * Corresponde al DTO ConversationDetail del design 00-foundation.
 */
export interface ConversationDetail extends ConversationSummary {
  warningSentAt?: string;
  closedAt?: string;
  closeReason?: CloseReason;
  messageCount: number;
  updatedAt: string;
}
