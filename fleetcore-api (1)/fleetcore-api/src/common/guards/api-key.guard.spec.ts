import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from './api-key.guard';

const ctxWith = (headers: Record<string, string>): ExecutionContext =>
  ({ switchToHttp: () => ({ getRequest: () => ({ headers }) }) }) as unknown as ExecutionContext;

describe('ApiKeyGuard', () => {
  const config = { get: () => 'key-1, key-2' } as unknown as ConfigService;
  const guard = new ApiKeyGuard(config);

  it('acepta cualquiera de las claves configuradas', () => {
    expect(guard.canActivate(ctxWith({ 'x-api-key': 'key-1' }))).toBe(true);
    expect(guard.canActivate(ctxWith({ 'x-api-key': 'key-2' }))).toBe(true);
  });

  it('rechaza una clave incorrecta', () => {
    expect(() => guard.canActivate(ctxWith({ 'x-api-key': 'nope' }))).toThrow(UnauthorizedException);
  });

  it('rechaza si no se envía el header', () => {
    expect(() => guard.canActivate(ctxWith({}))).toThrow(/no proporcionada/);
  });
});
