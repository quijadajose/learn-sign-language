import { Module } from '@nestjs/common';
import { UsersService } from './application/users/users.service';
import { UsersController } from './infrastructure/users/users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { LanguageModule } from 'src/language/language.module';
import { AuthService } from 'src/auth/application/auth.service';
import { LessonModule } from 'src/lesson/lesson.module';
import { GetUserLanguagesUseCase } from './application/use-cases/get-user-languages/get-user-languages.use-case';
import { UserLanguageRepository } from './infrastructure/repositories/user-language.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLanguage } from 'src/shared/domain/entities/userLanguage';
import { User } from 'src/shared/domain/entities/user';
import { EnrollUserInLanguageUseCase } from './infrastructure/users/enroll-user-in-language.use-case';

@Module({
  imports: [
    AuthModule,
    LanguageModule,
    LessonModule,
    TypeOrmModule.forFeature([User, UserLanguage]),
  ],
  providers: [
    UsersService,
    AuthService,
    EnrollUserInLanguageUseCase,
    GetUserLanguagesUseCase,
    {
      provide: 'UserLanguageRepositoryInterface',
      useClass: UserLanguageRepository,
    },
  ],
  controllers: [UsersController],
  exports: [UsersService, GetUserLanguagesUseCase, EnrollUserInLanguageUseCase],
})
export class UsersModule {}
