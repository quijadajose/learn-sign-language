import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { RegisterUserUseCase } from 'src/auth/domain/use-cases/register-user/register-user';
import { FindUserUseCase } from 'src/auth/domain/use-cases/find-user/find-user';
import { User } from 'src/shared/domain/entities/user';
import { AuthService } from 'src/auth/application/auth.service';

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
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, name, birthday } = profile;

    let user: User | null = await this.findUserUseCase.findByEmail(
      emails[0].value,
    );

    if (!user) {
      user = await this.registerUserUseCase.registerUserWithOAuth2({
        email: emails[0].value,
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
      access_token
    });
  }
  private calculateAge(birthday: string): number {
    const birthDate = new Date(birthday);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
}
