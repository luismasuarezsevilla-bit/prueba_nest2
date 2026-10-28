import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums';
import { RolesGuard } from './roles.guard';

const ctxWith = (user: any): ExecutionContext =>
  ({
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  it('deja pasar si la ruta no declara roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(ctxWith({ role: Role.TECHNICIAN }))).toBe(true);
  });

  it('permite el acceso si el usuario tiene el rol requerido', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.ADMIN]);
    expect(guard.canActivate(ctxWith({ role: Role.ADMIN }))).toBe(true);
  });

  it('responde 403 si el usuario no tiene el rol requerido', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(ctxWith({ role: Role.TECHNICIAN }))).toThrow(ForbiddenException);
  });
});
