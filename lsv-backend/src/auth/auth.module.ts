import { Module, forwardRef } from '@nestjs/common';
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
import { ResourceIdResolver } from './infrastructure/guards/resource-access/resource-id-resolver';
import { ResourceAccessGuard } from './infrastructure/guards/resource-access/resource-access.guard';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { Region } from 'src/shared/domain/entities/region';
import { Stages } from 'src/shared/domain/entities/stage';
import { LessonVariant } from 'src/shared/domain/entities/lessonVariant';
import { Quiz } from 'src/shared/domain/entities/quiz';
import { QuizVariant } from 'src/shared/domain/entities/quizVariant';
import { ModeratorModule } from '../moderator/moderator.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Lesson,
      Region,
      Stages,
      LessonVariant,
      Quiz,
      QuizVariant,
    ]),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '12h' },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => ModeratorModule),
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
    ResourceIdResolver,
    ResourceAccessGuard,
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
    ResourceIdResolver,
    ResourceAccessGuard,
  ],
})
export class AuthModule {}
