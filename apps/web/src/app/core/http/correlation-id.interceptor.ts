import { HttpInterceptorFn } from '@angular/common/http';

const CORRELATION_ID_HEADER = 'x-correlation-id';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Agrega un x-correlation-id a cada request saliente para trazabilidad. */
export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const cloned = req.clone({
    setHeaders: { [CORRELATION_ID_HEADER]: uuid() },
  });
  return next(cloned);
};
