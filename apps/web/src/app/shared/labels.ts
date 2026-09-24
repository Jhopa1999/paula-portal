import type {
  ConversationMode,
  ConversationStatus,
} from '@paula/contracts';

/** Etiqueta amigable de negocio para el flujo (RF-DETAIL-004). */
export function flowLabel(flow?: string): string {
  if (!flow) return 'Sin flujo';
  const map: Record<string, string> = {
    MENU: 'Menu principal',
    OPTION_1: 'Opcion 1 — Extractos',
    OPTION_2: 'Opcion 2 — Reporte / Retenciones',
    OPTION_3: 'Opcion 3 — Atencion / PQR',
  };
  return map[flow] ?? flow;
}

export function statusLabel(status: ConversationStatus): string {
  const map: Record<ConversationStatus, string> = {
    CREATED: 'Creada',
    ACTIVE: 'Activa',
    PENDING_TIMEOUT: 'Por vencer',
    CLOSED: 'Cerrada',
    ERROR: 'Error',
  };
  return map[status] ?? status;
}

export function modeLabel(mode: ConversationMode): string {
  const map: Record<ConversationMode, string> = {
    AUTOMATIC: 'Automatico',
    AGENT: 'Agente',
    MANUAL: 'Manual',
  };
  return map[mode] ?? mode;
}

/** Formatea un ISO UTC a la zona local del usuario. */
export function formatLocal(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

/** Etiqueta amigable para una accion de auditoria. */
export function auditActionLabel(action: string): string {
  const map: Record<string, string> = {
    SESSION_CREATED: 'Sesion creada',
    CONVERSATION_TAKEN: 'Conversacion tomada',
    ASSIGNED: 'Asignada',
    REASSIGNED: 'Reasignada',
    MODE_CHANGED: 'Cambio de modo',
    HANDOFF_REQUESTED: 'Handoff solicitado',
    MESSAGE_SENT: 'Mensaje enviado',
    SESSION_CLOSED: 'Sesion cerrada',
    TIMEOUT_WARNING_SENT: 'Aviso de inactividad',
    SESSION_ERROR: 'Error de sesion',
  };
  return map[action] ?? action;
}
