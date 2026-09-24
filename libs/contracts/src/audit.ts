/** Tipo de actor que origina un evento de auditoria. */
export type AuditActorType = 'USER' | 'AGENT' | 'SYSTEM' | 'BOT';

/** Accion de negocio auditada. */
export type AuditAction =
  | 'SESSION_CREATED'
  | 'CONVERSATION_TAKEN'
  | 'ASSIGNED'
  | 'REASSIGNED'
  | 'MODE_CHANGED'
  | 'HANDOFF_REQUESTED'
  | 'MESSAGE_SENT'
  | 'SESSION_CLOSED'
  | 'TIMEOUT_WARNING_SENT'
  | 'SESSION_ERROR';

/**
 * Evento de auditoria (timeline de una sesion).
 * No contiene secretos ni payloads sensibles (RF-AS-005).
 */
export interface AuditEvent {
  eventId: string;
  sessionId: string;
  action: AuditAction;
  actor: {
    type: AuditActorType;
    id?: string;
    name?: string;
  };
  occurredAt: string;
  correlationId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}
