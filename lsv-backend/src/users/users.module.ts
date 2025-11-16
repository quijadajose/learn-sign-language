import { Module } from '@nestjs/common';
import { UsersService } from './application/users/users.service';
import { UsersController } from './infrastructure/users/users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { LanguageModule } from 'src/language/language.module';
import { RegionModule } from 'src/region/region.module';
import { AuthService } from 'src/auth/application/auth.service';
import { LessonModule } from 'src/lesson/lesson.module';
import { GetUserLanguagesUseCase } from './application/use-cases/get-user-languages/get-user-languages.use-case';
import { UserLanguageRepository } from './infrastructure/repositories/user-language.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLanguage } from 'src/shared/domain/entities/userLanguage';
import { UserRegion } from 'src/shared/domain/entities/userRegion';
import { User } from 'src/shared/domain/entities/user';
import { EnrollUserInLanguageUseCase } from './infrastructure/users/enroll-user-in-language.use-case';
import { EnrollUserInRegionUseCase } from './application/use-cases/enroll-user-in-region/enroll-user-in-region.use-case';
import { GetUserRegionsUseCase } from './application/use-cases/get-user-regions/get-user-regions.use-case';
import { UnenrollUserFromLanguageUseCase } from './application/use-cases/unenroll-user-from-language/unenroll-user-from-language.use-case';
import { UnenrollUserFromRegionUseCase } from './application/use-cases/unenroll-user-from-region/unenroll-user-from-region.use-case';
import { UserRegionRepository } from './infrastructure/repositories/user-region.repository';

@Module({
  imports: [
    AuthModule,
    LanguageModule,
    RegionModule,
    LessonModule,
    TypeOrmModule.forFeature([User, UserLanguage, UserRegion]),
  ],
  providers: [
    {
      provide: 'UserLanguageRepositoryInterface',
      useClass: UserLanguageRepository,
    },
    {
      provide: 'UserRegionRepositoryInterface',
      useClass: UserRegionRepository,
    },
    GetUserLanguagesUseCase,
    GetUserRegionsUseCase,
    EnrollUserInLanguageUseCase,
    EnrollUserInRegionUseCase,
    UnenrollUserFromLanguageUseCase,
    UnenrollUserFromRegionUseCase,
    UsersService,
    AuthService,
  ],
  controllers: [UsersController],
  exports: [
    UsersService,
    GetUserLanguagesUseCase,
    GetUserRegionsUseCase,
    EnrollUserInLanguageUseCase,
    EnrollUserInRegionUseCase,
  ],
})
export class UsersModule {}
