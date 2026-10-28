import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { Public } from './public.decorator';

/**
 * Protege un endpoint de integración externa con x-api-key en lugar de JWT.
 * Combina @Public() (salta el JWT global) + ApiKeyGuard + documentación Swagger.
 */
export const ApiKeyAuth = () =>
  applyDecorators(
    Public(),
    UseGuards(ApiKeyGuard),
    ApiSecurity('api-key'),
    ApiUnauthorizedResponse({ description: 'API Key ausente o incorrecta' }),
  );
