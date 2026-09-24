import type { ApiError, ResponseMeta } from '@paula/contracts';

/** Respuesta exitosa del backend: { data, meta }. */
export interface ApiEnvelope<T> {
  data: T;
  meta: ResponseMeta;
}

/** Respuesta paginada del backend: { data, pagination, meta }. */
export interface PaginatedEnvelope<T> {
  data: T[];
  pagination: { nextCursor?: string };
  meta: ResponseMeta;
}

/** Error normalizado que el frontend maneja de forma consistente. */
export interface NormalizedError {
  code: ApiError['code'] | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  status: number;
  correlationId?: string;
}
