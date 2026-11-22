import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { RegisterUserUseCase } from '../../domain/use-cases/register-user/register-user.js';
import { FindUserUseCase } from '../../domain/use-cases/find-user/find-user.js';
import { User } from '../../../shared/domain/entities/user.js';
import { AuthService } from '../../application/auth.service.js';
import { normalizeEmail } from '../../domain/utils/normalize-email.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/user.birthday.read',
      ],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      id: string;
      emails: { value: string }[];
      name: { givenName: string; familyName: string };
      birthday?: string;
    },
    done: VerifyCallback,
  ): Promise<void> {
    const { id, emails, name, birthday } = profile;

    // BE-14: no vincular cuentas por email si Google no lo ha verificado.
    const emailVerified = (
      profile as unknown as { _json?: { email_verified?: boolean } }
    )._json?.email_verified;
    if (emailVerified === false) {
      return done(null, false);
    }

    let user: User | null = await this.findUserUseCase.findByEmail(
      normalizeEmail(emails[0].value),
    );

    if (!user) {
      user = await this.registerUserUseCase.registerUserWithOAuth2({
        email: normalizeEmail(emails[0].value),
        firstName: name.givenName,
        lastName: name.familyName,
        age: birthday ? this.calculateAge(birthday) : null,
        googleId: id,
      });
    }

    const access_token = this.authService.generateToken(user);
    done(null, {
      sub: user.id,
      email: user.email,
      access_token,
    });
  }
  private calculateAge(birthday: string): number {
    const birthDate = new Date(birthday);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
}
