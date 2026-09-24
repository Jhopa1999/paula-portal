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
