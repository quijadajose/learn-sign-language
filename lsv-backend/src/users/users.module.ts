import { Module } from '@nestjs/common';
import { UsersService } from './application/users/users.service.js';
import { UsersController } from './infrastructure/users/users.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { LanguageModule } from '../language/language.module.js';
import { RegionModule } from '../region/region.module.js';
import { AuthService } from '../auth/application/auth.service.js';
import { LessonModule } from '../lesson/lesson.module.js';
import { GetUserLanguagesUseCase } from './application/use-cases/get-user-languages/get-user-languages.use-case.js';
import { UserLanguageRepository } from './infrastructure/repositories/user-language.repository.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLanguage } from '../shared/domain/entities/userLanguage.js';
import { UserRegion } from '../shared/domain/entities/userRegion.js';
import { User } from '../shared/domain/entities/user.js';
import { EnrollUserInLanguageUseCase } from './application/use-cases/enroll-user-in-language/enroll-user-in-language.use-case.js';
import { EnrollUserInRegionUseCase } from './application/use-cases/enroll-user-in-region/enroll-user-in-region.use-case.js';
import { GetUserRegionsUseCase } from './application/use-cases/get-user-regions/get-user-regions.use-case.js';
import { UnenrollUserFromLanguageUseCase } from './application/use-cases/unenroll-user-from-language/unenroll-user-from-language.use-case.js';
import { UnenrollUserFromRegionUseCase } from './application/use-cases/unenroll-user-from-region/unenroll-user-from-region.use-case.js';
import { UserRegionRepository } from './infrastructure/repositories/user-region.repository.js';

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
