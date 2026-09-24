import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import type { ApiErrorCode, ApiErrorResponse } from '@paula/contracts';
import { DomainException } from './domain.exception';

/**
 * Filtro global: normaliza cualquier error al envelope ApiErrorResponse.
 * Nunca expone stack traces ni mensajes tecnicos crudos al cliente.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { correlationId?: string }>();
    const correlationId = request.correlationId ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ApiErrorCode = 'INTERNAL_ERROR';
    let message = 'Ocurrio un error inesperado.';

    if (exception instanceof DomainException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (status === HttpStatus.BAD_REQUEST) {
        code = 'VALIDATION_ERROR';
        message =
          typeof res === 'object' && res !== null && 'message' in res
            ? this.flattenMessage((res as { message: unknown }).message)
            : exception.message;
      } else if (status === HttpStatus.UNAUTHORIZED) {
        code = 'UNAUTHORIZED';
        message = 'No autorizado.';
      } else if (status === HttpStatus.FORBIDDEN) {
        code = 'FORBIDDEN_ACTION';
        message = 'No tiene permiso para realizar esta accion.';
      } else {
        message = exception.message;
      }
    }

    this.logger.error(
      `[${correlationId}] ${request.method} ${request.url} -> ${status} ${code}: ${message}`,
    );

    const body: ApiErrorResponse = {
      error: { code, message },
      meta: { correlationId },
    };

    response.status(status).json(body);
  }

  private flattenMessage(message: unknown): string {
    if (Array.isArray(message)) {
      return message.join('; ');
    }
    return typeof message === 'string' ? message : 'Datos invalidos.';
  }
}
