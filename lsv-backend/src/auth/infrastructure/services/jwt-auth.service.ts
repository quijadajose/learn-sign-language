import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  GenerateTokenOptions,
  TokenService,
} from '../../domain/ports/token.service/token.service.interface.js';
import {
  JwtPayload,
  JwtPurpose,
} from '../../interfaces/jwt-payload.interface.js';
import { User } from '../../../shared/domain/entities/user.js';

@Injectable()
export class JwtAuthService implements TokenService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  generateToken(user: User, options?: GenerateTokenOptions): string {
    const purpose: JwtPurpose = options?.purpose ?? 'access';
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
      purpose,
    };
    const signOptions: JwtSignOptions | undefined = options?.expiresIn
      ? { expiresIn: options.expiresIn as JwtSignOptions['expiresIn'] }
      : undefined;

    return this.jwtService.sign(payload, signOptions);
  }

  verifyToken(
    token: string,
    expectedPurpose: JwtPurpose = 'access',
  ): JwtPayload {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      }) as JwtPayload;
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        throw new UnauthorizedException('errors.auth.tokenExpired');
      }
      const purpose: JwtPurpose = decoded.purpose ?? 'access';
      if (purpose !== expectedPurpose) {
        throw new UnauthorizedException('errors.auth.invalidToken');
      }
      return { ...decoded, purpose };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('errors.auth.invalidToken');
    }
  }
}
