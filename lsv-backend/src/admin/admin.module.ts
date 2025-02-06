import { Module } from '@nestjs/common';
import { LanguageRepository } from '../language/infrastructure/typeorm/language.repository/language.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from 'src/shared/domain/entities/language';
import { LanguageController } from '../language/infrastructure/controllers/language-admin/language-admin.controller';
import { LanguageService } from '../language/application/services/language/language-admin.service';
import { CreateLanguageUseCase } from '../language/application/use-cases/create-language-use-case/create-language-use-case';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { ListLanguagesUseCase } from '../language/application/use-cases/list-languages-use-case/list-languages-use-case';
import { GetLanguageUseCase } from '../language/application/use-cases/get-language-use-case/get-language-use-case';
import { UpdateLanguagesUseCase } from '../language/application/use-cases/update-languages-use-case/update-languages-use-case';
import { DeleteLanguagesUseCase } from '../language/application/use-cases/delete-languages-use-case/delete-languages-use-case';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { Stages } from 'src/shared/domain/entities/stage';
import { LessonService } from '../lesson/application/services/lesson/lesson.service';
import { StageRepository } from '../stage/infrastructure/typeorm/stage.repository/stage.repository';
import { UploadPictureUseCase } from 'src/shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';
import { GetLessonByLaguageUseCase } from '../lesson/application/use-cases/get-lesson-by-laguage-use-case/get-lesson-by-laguage-use-case';
import { GetLessonByIdUseCase } from '../lesson/application/use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case';
import { DeleteLessonUseCase } from '../lesson/application/use-cases/delete-lesson-use-case/delete-lesson-use-case';
import { GetStagesFromLanguageUseCase } from '../stage/application/use-cases/get-stages-from-language-use-case/get-stages-from-language-use-case';
import { StageService } from './application/services/stage-admin/stage-admin.service';
import { UpdateLessonuseCase } from 'src/lesson/application/use-cases/update-lessonuse-case/update-lessonuse-case';
import { CreateLessonUseCase } from 'src/lesson/application/use-cases/create-lesson-use-case/create-lesson-use-case';
import { LessonController } from 'src/lesson/infrastructure/controllers/lesson/lesson.controller';
import { CreateStageUseCase } from 'src/stage/application/use-cases/create-stage-use-case/create-stage-use-case';
import { UpdateStageUseCase } from 'src/stage/application/use-cases/update-stage-use-case/update-stage-use-case';
import { DeleteStageUseCase } from 'src/stage/application/use-cases/delete-stage-use-case/delete-stage-use-case';
import { LessonRepository } from 'src/lesson/infrastructure/typeorm/lesson.repository/lesson.repository';
import { StageController } from 'src/stage/infrastructure/controllers/stage-admin/stage-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Language, Lesson, Stages])],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    LanguageRepository,
    LanguageService,
    CreateLanguageUseCase,
    GetLanguageUseCase,
    ListLanguagesUseCase,
    UpdateLanguagesUseCase,
    DeleteLanguagesUseCase,
    CreateLessonUseCase,
    LessonService,
    UploadPictureUseCase,
    GetLessonByLaguageUseCase,
    GetLessonByIdUseCase,
    UpdateLessonuseCase,
    DeleteLessonUseCase,
    GetStagesFromLanguageUseCase,
    StageService,
    CreateStageUseCase,
    UpdateStageUseCase,
    DeleteStageUseCase,
    {
      provide: 'LanguageRepositoryInterface',
      useClass: LanguageRepository,
    },
    {
      provide: 'LessonRepositoryInterface',
      useClass: LessonRepository,
    },
    {
      provide: 'StageRepositoryInterface',
      useClass: StageRepository,
    },
  ],
  controllers: [LanguageController, LessonController, StageController],
  exports: [LanguageService, LessonService, StageService],
})
export class AdminModule {}
