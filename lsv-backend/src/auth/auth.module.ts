import { Module } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import Redis from 'ioredis';
import { AuthService } from './application/auth.service';
import { AuthController } from './infrastructure/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/shared/domain/entities/user';
import { RegisterUserUseCase } from './domain/use-cases/register-user/register-user';
import { UserRepository } from './infrastructure/typeorm/user.repository/user.repository';
import { BcryptService } from './infrastructure/services/bcrypt.service';
import { JwtAuthService } from './infrastructure/services/jwt-auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './infrastructure/strategies/google.strategy';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { FindUserUseCase } from './domain/use-cases/find-user/find-user';
import { NodeMailerService } from './infrastructure/services/nodemailer.service';
import { UpdateUserUseCase } from './domain/use-cases/update-user/update-user';
import { SendEmailUseCase } from './domain/use-cases/send-email/send-email';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth/jwt-auth.guard';
import { OAuthCodeStore } from './infrastructure/oauth-code.store';
import { ACCESS_TOKEN_TTL } from 'src/shared/infrastructure/auth-cookie';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: ACCESS_TOKEN_TTL },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    GoogleStrategy,
    JwtStrategy,
    AuthService,
    UpdateUserUseCase,
    RegisterUserUseCase,
    FindUserUseCase,
    SendEmailUseCase,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: 'MAIL_TRANSPORTER',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return nodemailer.createTransport({
          host: configService.get<string>('EMAIL_HOST'),
          port: configService.get<number>('EMAIL_PORT', 587),
          secure: configService.get<number>('EMAIL_PORT') === 465, // true para 465, false para otros
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASSWORD'),
          },
          tls: {
            rejectUnauthorized:
              configService.get<string>('NODE_ENV') === 'development'
                ? false
                : true,
          },
        });
      },
    },
    {
      provide: 'TokenService',
      useClass: JwtAuthService,
    },
    {
      provide: 'HashService',
      useClass: BcryptService,
    },
    {
      provide: 'EmailService',
      useClass: NodeMailerService,
    },
    {
      provide: 'UserRepositoryInterface',
      useClass: UserRepository,
    },
    {
      provide: 'OAUTH_CODE_REDIS',
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis({
          host: config.get<string>('VALKEY_HOST'),
          port: Number(config.get('VALKEY_PORT')),
          password: config.get<string>('VALKEY_PASSWORD'),
          maxRetriesPerRequest: 3,
        }),
    },
    OAuthCodeStore,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    RegisterUserUseCase,
    FindUserUseCase,
    SendEmailUseCase,
    UpdateUserUseCase,
    'TokenService',
    'HashService',
    'UserRepositoryInterface',
    OAuthCodeStore,
  ],
})
export class AuthModule {}
