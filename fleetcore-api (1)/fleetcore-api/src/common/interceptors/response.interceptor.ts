import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  timestamp: string;
}

/**
 * INTERCEPTOR GLOBAL: envuelve toda respuesta exitosa en un formato uniforme
 * { success, statusCode, data, timestamp }. El statusCode se toma de la respuesta
 * real (200 en GET/PATCH, 201 en POST, etc.).
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        statusCode: response.statusCode,
        data: data === undefined ? (null as unknown as T) : data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
