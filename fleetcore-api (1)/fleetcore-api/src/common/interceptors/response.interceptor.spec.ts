import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  const ctx = { switchToHttp: () => ({ getResponse: () => ({ statusCode: 201 }) }) } as unknown as ExecutionContext;

  it('envuelve la respuesta en { success, statusCode, data, timestamp }', async () => {
    const next: CallHandler = { handle: () => of({ id: 1 }) };
    const result = await lastValueFrom(new ResponseInterceptor().intercept(ctx, next));
    expect(result).toMatchObject({ success: true, statusCode: 201, data: { id: 1 } });
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('devuelve data null cuando el handler no retorna nada', async () => {
    const next: CallHandler = { handle: () => of(undefined) };
    const result = await lastValueFrom(new ResponseInterceptor().intercept(ctx, next));
    expect(result.data).toBeNull();
  });
});
