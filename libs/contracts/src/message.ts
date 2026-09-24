import type {
  MessageRole,
  MessageType,
  DeliveryStatus,
} from './enums.js';
import type { UserRef } from './conversation.js';

/** Metadata de un adjunto (el binario vive en S3, aqui solo la referencia). */
export interface MessageAttachment {
  name?: string;
  contentType?: string;
  /** URL firmada temporal entregada por el backend; nunca credenciales S3. */
  url?: string;
}

/**
 * Mensaje de una conversacion.
 * Corresponde al DTO ConversationMessage del design 00-foundation.
 */
export interface ConversationMessage {
  messageId: string;
  sessionId: string;

  role: MessageRole;
  type: MessageType;

  content?: string;
  attachment?: MessageAttachment;

  createdAt: string;

  deliveryStatus?: DeliveryStatus;

  author?: UserRef;
}
