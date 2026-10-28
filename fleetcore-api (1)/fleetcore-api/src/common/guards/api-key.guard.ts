import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';

/**
 * GUARD ESPECÍFICO para integraciones externas: valida el header `x-api-key`
 * contra la lista de claves de la variable de entorno API_KEYS (separadas por coma).
 * La comparación es en tiempo constante para evitar ataques de temporización.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-api-key'];

    if (typeof provided !== 'string' || provided.length === 0) {
      throw new UnauthorizedException('API Key no proporcionada (header x-api-key)');
    }

    const validKeys = (this.config.get<string>('API_KEYS') ?? '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (!validKeys.some((key) => this.safeEqual(key, provided))) {
      throw new UnauthorizedException('API Key inválida');
    }
    return true;
  }

  private safeEqual(a: string, b: string): boolean {
    const ha = createHash('sha256').update(a).digest();
    const hb = createHash('sha256').update(b).digest();
    return timingSafeEqual(ha, hb);
  }
}
