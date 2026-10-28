import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * GUARD GLOBAL de autenticación (JWT).
 * - Rutas marcadas con @Public() pasan sin token.
 * - Para el resto exige un Bearer token válido y vigente; si no, responde 401
 *   con un mensaje que distingue: sin token, token expirado o token inválido.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (user && !err) return user;
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('El token ha expirado');
    }
    if (info?.name === 'JsonWebTokenError') {
      throw new UnauthorizedException('El token es inválido');
    }
    if (err instanceof UnauthorizedException) throw err;
    throw new UnauthorizedException('Token de autenticación no proporcionado');
  }
}
