import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'AGROTIC_LALUPA',
    });
  }

  async validate(payload: any) {
    return { 
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      numero_documento: payload.numero_documento,
      nombre: payload.nombre
    };
  }
}
