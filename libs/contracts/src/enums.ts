/**
 * Enumeraciones de dominio compartidas.
 * Reflejan los valores definidos en data-model.md y no deben inventarse
 * estados propios en la Web.
 */

/** Modo de la conversacion. */
export type ConversationMode = 'AUTOMATIC' | 'AGENT' | 'MANUAL';

/** Estado de la conversacion (ciclo de vida de la sesion). */
export type ConversationStatus =
  | 'CREATED'
  | 'ACTIVE'
  | 'PENDING_TIMEOUT'
  | 'CLOSED'
  | 'ERROR';

/** Direccion de un mensaje respecto al canal. */
export type MessageDirection = 'INBOUND' | 'OUTBOUND' | 'INTERNAL';

/** Rol del emisor de un mensaje. */
export type MessageRole = 'user' | 'assistant' | 'advisor' | 'system' | 'tool';

/** Tipo de mensaje mostrado en el chat. */
export type MessageType =
  | 'text'
  | 'image'
  | 'document'
  | 'system_event'
  | 'internal_note';

/** Estado de entrega de un mensaje saliente. */
export type DeliveryStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED';

/** Motivo de cierre de una sesion. */
export type CloseReason =
  | 'USER_FINISHED'
  | 'AGENT_FINISHED'
  | 'TIMEOUT'
  | 'MANUAL'
  | 'SYSTEM_ERROR';

/** Grupos/roles de usuario en Cognito. */
export type UserRole = 'PAULA_ADVISOR' | 'PAULA_SUPERVISOR' | 'PAULA_ADMIN';
