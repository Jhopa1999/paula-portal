/**
 * Envelope de respuesta y error compartido por la API.
 * El frontend usa `error.code` para logica, nunca el mensaje textual.
 */

export interface ResponseMeta {
  correlationId: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
}

/** Codigos de error compartidos entre equipos. */
export type ApiErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_CLOSED'
  | 'CONVERSATION_ALREADY_ASSIGNED'
  | 'INVALID_SESSION_MODE'
  | 'FORBIDDEN_ACTION'
  | 'MESSAGE_ALREADY_PROCESSED'
  | 'INVALID_COMMAND_VERSION'
  | 'OUTBOUND_SEND_FAILED'
  | 'CONTACT_NOT_FOUND'
  | 'INTEGRATION_UNAVAILABLE'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'INTERNAL_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiError;
  meta: ResponseMeta;
}

/** Paginacion cursor-based para listados. */
export interface Pagination {
  nextCursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
  meta: ResponseMeta;
}
