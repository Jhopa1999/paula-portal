import type { ConversationMode, ConversationStatus } from './enums.js';

/** Filtros soportados al listar conversaciones. */
export interface ListConversationsQuery {
  status?: ConversationStatus;
  mode?: ConversationMode;
  assignedTo?: string;
  assignmentState?: 'ASSIGNED' | 'UNASSIGNED';
  flow?: string;
  phone?: string;
  thirdPartyId?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

/** Vistas rapidas de la bandeja. */
export type InboxView = 'mine' | 'unassigned' | 'all' | 'closed';
