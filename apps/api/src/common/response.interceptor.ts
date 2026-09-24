import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '@paula/contracts';

/**
 * Envuelve toda respuesta exitosa en el envelope { data, meta }.
 * Si el controller ya devolvio un objeto con `data` y `pagination`
 * (respuesta paginada), solo agrega meta.
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | (T & { meta: unknown })>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | (T & { meta: unknown })> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { correlationId?: string }>();
    const correlationId = request.correlationId ?? 'unknown';

    return next.handle().pipe(
      map((payload) => {
        if (
          payload !== null &&
          typeof payload === 'object' &&
          'pagination' in payload
        ) {
          return { ...(payload as object), meta: { correlationId } } as T & {
            meta: unknown;
          };
        }
        return { data: payload, meta: { correlationId } };
      }),
    );
  }
}
