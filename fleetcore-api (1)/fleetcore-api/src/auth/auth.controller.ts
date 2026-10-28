import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@ApiExtraModels(LoginDto, RegisterDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiBody({
    schema: { $ref: getSchemaPath(RegisterDto) },
    examples: {
      technician: {
        summary: 'Registro público de técnico',
        value: { email: 'nuevo@fleetcore.com', password: 'Password123', fullName: 'Nuevo Técnico' },
      },
    },
  })
  @ApiOperation({ summary: 'Registro público (crea un usuario TECHNICIAN)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    schema: { $ref: getSchemaPath(LoginDto) },
    examples: {
      adminSeed: {
        summary: 'ADMIN del seed',
        value: { email: 'admin@fleetcore.com', password: 'Admin123*' },
      },
      technicianSeed: {
        summary: 'TECHNICIAN del seed',
        value: { email: 'tech1@fleetcore.com', password: 'Tech123*' },
      },
    },
  })
  @ApiOperation({ summary: 'Inicio de sesión: devuelve el JWT' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Datos del usuario autenticado' })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
