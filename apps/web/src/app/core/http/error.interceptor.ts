import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import type { ApiErrorResponse } from '@paula/contracts';
import { NormalizedError } from './api.types';
import { AuthService } from '../auth/auth.service';

/**
 * Normaliza cualquier error HTTP a NormalizedError usando error.code.
 * Maneja los casos criticos: 401 (redirige a login), 403, 409, red y 5xx.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const normalized = normalize(err);

      if (normalized.status === 401) {
        // Sesion expirada / no autenticado: limpia sesion y va a login.
        auth.logout();
        void router.navigate(['/login']);
      }

      return throwError(() => normalized);
    }),
  );
};

function normalize(err: HttpErrorResponse): NormalizedError {
  // Error de red / servidor inalcanzable
  if (err.status === 0) {
    return {
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor. Revise su conexion.',
      status: 0,
    };
  }

  const body = err.error as Partial<ApiErrorResponse> | undefined;
  if (body && body.error && body.error.code) {
    return {
      code: body.error.code,
      message: body.error.message,
      status: err.status,
      correlationId: body.meta?.correlationId,
    };
  }

  return {
    code: 'UNKNOWN',
    message: 'Ocurrio un error inesperado.',
    status: err.status,
  };
}
