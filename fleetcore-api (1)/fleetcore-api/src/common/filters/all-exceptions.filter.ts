import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

/** Traducción de errores de PostgreSQL a respuestas HTTP (nunca un 500 por culpa del cliente). */
const PG_ERRORS: Record<string, { status: number; message: string }> = {
  '23505': { status: HttpStatus.CONFLICT, message: 'Ya existe un registro con ese valor único' },
  '23503': { status: HttpStatus.CONFLICT, message: 'Operación inválida: el registro referencia o es referenciado por otros datos' },
  '23502': { status: HttpStatus.BAD_REQUEST, message: 'Falta un campo obligatorio' },
  '22P02': { status: HttpStatus.BAD_REQUEST, message: 'Formato de dato inválido' },
  '22003': { status: HttpStatus.BAD_REQUEST, message: 'Valor numérico fuera de rango' },
};

/**
 * FILTRO GLOBAL de excepciones. Todo error sale con el mismo formato:
 * { success:false, statusCode, message, path, timestamp }.
 * - HttpException (validación, auth, 404, conflictos de negocio): conserva su status.
 * - QueryFailedError de Postgres (p. ej. 23505 = unicidad): se convierte en 409/400.
 * - Cualquier otra cosa: 500 con mensaje genérico (el detalle solo va al log).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string' ? body : ((body as any).message ?? exception.message);
    } else if (exception instanceof QueryFailedError) {
      const driverError = (exception as any).driverError ?? {};
      const mapped = PG_ERRORS[driverError.code as string];
      if (mapped) {
        status = mapped.status;
        message = driverError.detail ? `${mapped.message}: ${driverError.detail}` : mapped.message;
      } else {
        this.logger.error(exception.message, exception.stack);
      }
    } else {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
