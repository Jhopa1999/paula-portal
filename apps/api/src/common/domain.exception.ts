import { HttpException, HttpStatus } from '@nestjs/common';
import type { ApiErrorCode } from '@paula/contracts';

/**
 * Excepcion de dominio que transporta un codigo de error compartido.
 * El filtro global la convierte en el envelope ApiErrorResponse.
 */
export class DomainException extends HttpException {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, status);
  }
}
