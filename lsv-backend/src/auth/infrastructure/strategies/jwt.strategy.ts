import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { UserRepositoryInterface } from 'src/auth/domain/ports/user.repository.interface/user.repository.interface';
import { extractAccessToken } from 'src/shared/infrastructure/extract-access-token';

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
    });
  }

  async validate(payload: JwtPayload) {
    if ((payload.purpose ?? 'access') !== 'access') {
      throw new UnauthorizedException('errors.auth.invalidToken');
    }
    const authState = await this.userRepository.findAuthStateById(payload.sub);
    if (!authState || authState.tokenVersion !== (payload.tokenVersion ?? 0)) {
      throw new UnauthorizedException('errors.auth.invalidToken');
    }
    return { sub: payload.sub, email: payload.email, role: authState.role };
  }
}
