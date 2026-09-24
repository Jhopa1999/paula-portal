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

/** Datos del contacto embebidos en el detalle. */
export interface ConversationContactInfo {
  name?: string;
  phone: string;
  identification?: string;
}

/** Datos de la sesion para el panel de detalle. */
export interface ConversationSessionInfo {
  createdAt: string;
  lastActivityAt: string;
  warningSentAt?: string;
  closedAt?: string;
  closeReason?: CloseReason;
  messageCount: number;
  version: number;
}

/**
 * Capacidades del usuario sobre la conversacion, calculadas por el backend
 * segun rol y estado. La UI las usa para mostrar/ocultar acciones, pero el
 * backend siempre revalida (ocultar un boton no es seguridad).
 */
export interface ConversationCapabilities {
  canTake: boolean;
  canSendMessage: boolean;
  canAssign: boolean;
  canChangeMode: boolean;
  canClose: boolean;
  canViewTechnical: boolean;
}

/**
 * Detalle completo de una conversacion/sesion (agregado).
 * Corresponde al DTO ConversationDetail de los designs 00-foundation y 05.
 */
export interface ConversationDetail extends ConversationSummary {
  warningSentAt?: string;
  closedAt?: string;
  closeReason?: CloseReason;
  messageCount: number;
  updatedAt: string;

  contact?: ConversationContactInfo;
  session: ConversationSessionInfo;
  capabilities: ConversationCapabilities;
}
