import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguageModule } from '../language/language.module.js';
import { QuizModule } from '../quiz/quiz.module.js';
import { UploadPictureUseCase } from '../shared/application/use-cases/upload-picture-use-case/upload-picture-use-case.js';
import { Language } from '../shared/domain/entities/language.js';
import { Lesson } from '../shared/domain/entities/lesson.js';
import { QuizSubmission } from '../shared/domain/entities/quizSubmission.js';
import { Stages } from '../shared/domain/entities/stage.js';
import { LessonVariant } from '../shared/domain/entities/lessonVariant.js';
import { Region } from '../shared/domain/entities/region.js';
import { LessonService } from './application/services/lesson/lesson.service.js';
import { CreateLessonUseCase } from './application/use-cases/create-lesson-use-case/create-lesson-use-case.js';
import { DeleteLessonUseCase } from './application/use-cases/delete-lesson-use-case/delete-lesson-use-case.js';
import { GetLessonByIdUseCase } from './application/use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case.js';
import { GetLessonByLanguageUseCase } from './application/use-cases/get-lesson-by-laguage-use-case/get-lesson-by-laguage-use-case.js';
import { GetLessonWithQuizzesUseCase } from './application/use-cases/get-lesson-with-quizzes-use-case/get-lesson-with-quizzes-use-case.js';
import { GetQuizzesByLessonIdUseCase } from './application/use-cases/get-quizzes-by-lesson-id-use-case/get-quizzes-by-lesson-id-use-case.js';
import { GetLessonsByLanguageWithSubmissionsUseCase } from './application/use-cases/get-lessons-by-language-with-submissions-use-case/get-lessons-by-language-with-submissions-use-case.js';
import { GetLessonVariantsUseCase } from './application/use-cases/get-lesson-variants-use-case/get-lesson-variants-use-case.js';
import { CreateLessonVariantUseCase } from './application/use-cases/create-lesson-variant-use-case/create-lesson-variant-use-case.js';
import { GetLessonVariantUseCase } from './application/use-cases/get-lesson-variant-use-case/get-lesson-variant-use-case.js';
import { UpdateLessonVariantUseCase } from './application/use-cases/update-lesson-variant-use-case/update-lesson-variant-use-case.js';
import { DeleteLessonVariantUseCase } from './application/use-cases/delete-lesson-variant-use-case/delete-lesson-variant-use-case.js';
import { GetRegionalLessonUseCase } from './application/use-cases/get-regional-lesson-use-case/get-regional-lesson-use-case.js';
import { UpdateLessonuseCase } from './application/use-cases/update-lessonuse-case/update-lessonuse-case.js';
import { LessonController } from './infrastructure/controllers/lesson/lesson.controller.js';
import { LessonRepository } from './infrastructure/typeorm/lesson.repository/lesson.repository.js';
import { LessonVariantRepository } from './infrastructure/typeorm/lesson-variant.repository/lesson-variant.repository.js';
import { RegionRepository } from './infrastructure/typeorm/region.repository/region.repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lesson,
      Stages,
      Language,
      QuizSubmission,
      LessonVariant,
      Region,
    ]),
    forwardRef(() => LanguageModule),
    forwardRef(() => QuizModule),
  ],
  providers: [
    LessonService,
    CreateLessonUseCase,
    UploadPictureUseCase,
    GetLessonByLanguageUseCase,
    GetLessonByIdUseCase,
    UpdateLessonuseCase,
    DeleteLessonUseCase,
    GetLessonWithQuizzesUseCase,
    GetQuizzesByLessonIdUseCase,
    GetLessonsByLanguageWithSubmissionsUseCase,
    GetLessonVariantsUseCase,
    CreateLessonVariantUseCase,
    GetLessonVariantUseCase,
    UpdateLessonVariantUseCase,
    DeleteLessonVariantUseCase,
    GetRegionalLessonUseCase,
    LessonVariantRepository,
    RegionRepository,
    {
      provide: 'LessonRepositoryInterface',
      useClass: LessonRepository,
    },
  ],
  controllers: [LessonController],
  exports: [
    LessonService,
    CreateLessonUseCase,
    GetLessonByIdUseCase,
    UpdateLessonuseCase,
    DeleteLessonUseCase,
    GetLessonWithQuizzesUseCase,
    GetQuizzesByLessonIdUseCase,
    GetLessonsByLanguageWithSubmissionsUseCase,
    GetRegionalLessonUseCase,
    LessonVariantRepository,
    RegionRepository,
    {
      provide: 'LessonRepositoryInterface',
      useClass: LessonRepository,
    },
    TypeOrmModule,
  ],
})
export class LessonModule {}
