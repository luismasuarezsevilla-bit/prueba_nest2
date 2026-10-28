import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create({ ...dto, role: Role.TECHNICIAN });
    return { user, accessToken: this.sign(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    // Mismo mensaje para "no existe" y "clave incorrecta": no revela qué correos existen
    const valid = user ? await bcrypt.compare(dto.password, user.password) : false;
    if (!user || !valid || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const publicUser = this.usersService.toPublic(user);
    return { user: publicUser, accessToken: this.sign(publicUser) };
  }

  private sign(user: { id: number; email: string; role: Role }) {
    return this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
  }
}
