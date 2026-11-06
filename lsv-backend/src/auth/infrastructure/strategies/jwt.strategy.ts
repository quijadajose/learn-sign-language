import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { JwtPayload } from '../../interfaces/jwt-payload.interface.js';
import {
  UserAuthState,
  UserRepositoryInterface,
} from '../../domain/ports/user.repository.interface/user.repository.interface.js';
import { extractAccessToken } from '../../../shared/infrastructure/extract-access-token.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => extractAccessToken(req),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: { resolvedAuthState?: UserAuthState },
    payload: JwtPayload,
  ) {
    if ((payload.purpose ?? 'access') !== 'access') {
      throw new UnauthorizedException('errors.auth.invalidToken');
    }
    // BE-30: JwtAuthGuard ya resolvió el estado de la sesión en esta request; no se consulta dos veces.
    const authState =
      req?.resolvedAuthState ??
      (await this.userRepository.findAuthStateById(payload.sub));
    if (!authState || authState.tokenVersion !== (payload.tokenVersion ?? 0)) {
      throw new UnauthorizedException('errors.auth.invalidToken');
    }
    return { sub: payload.sub, email: payload.email, role: authState.role };
  }
}
