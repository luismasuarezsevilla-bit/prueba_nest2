import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // un token vencido se rechaza con 401
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /** Se ejecuta con un token ya verificado; recarga al usuario para respetar cambios de rol o desactivación. */
  async validate(payload: { sub: number }): Promise<AuthUser> {
    const user = await this.usersService.findOne(payload.sub).catch(() => null);
    if (!user || !user.isActive) throw new UnauthorizedException('Usuario inexistente o inactivo');
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
  }
}
