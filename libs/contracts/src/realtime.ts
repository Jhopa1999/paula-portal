/**
 * Contrato de eventos WebSocket (servidor -> cliente).
 * Cada evento tiene eventId para deduplicacion del cliente.
 */

export type RealtimeEventType =
  | 'conversation.created'
  | 'conversation.updated'
  | 'conversation.assigned'
  | 'conversation.closed'
  | 'message.created'
  | 'message.updated'
  | 'session.mode_changed'
  | 'session.status_changed'
  | 'advisor.joined'
  | 'advisor.left';

export interface RealtimeEvent<T = unknown> {
  eventId: string;
  type: RealtimeEventType;
  sessionId?: string;
  occurredAt: string;
  data: T;
}
