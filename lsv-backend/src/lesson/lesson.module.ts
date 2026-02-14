import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguageModule } from 'src/language/language.module';
import { QuizModule } from 'src/quiz/quiz.module';
import { UploadPictureUseCase } from 'src/shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';
import { Language } from 'src/shared/domain/entities/language';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { QuizSubmission } from 'src/shared/domain/entities/quizSubmission';
import { Stages } from 'src/shared/domain/entities/stage';
import { LessonVariant } from 'src/shared/domain/entities/lessonVariant';
import { Region } from 'src/shared/domain/entities/region';
import { LessonService } from './application/services/lesson/lesson.service';
import { CreateLessonUseCase } from './application/use-cases/create-lesson-use-case/create-lesson-use-case';
import { DeleteLessonUseCase } from './application/use-cases/delete-lesson-use-case/delete-lesson-use-case';
import { GetLessonByIdUseCase } from './application/use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case';
import { GetLessonByLanguageUseCase } from './application/use-cases/get-lesson-by-laguage-use-case/get-lesson-by-laguage-use-case';
import { GetLessonWithQuizzesUseCase } from './application/use-cases/get-lesson-with-quizzes-use-case/get-lesson-with-quizzes-use-case';
import { GetQuizzesByLessonIdUseCase } from './application/use-cases/get-quizzes-by-lesson-id-use-case/get-quizzes-by-lesson-id-use-case';
import { GetLessonsByLanguageWithSubmissionsUseCase } from './application/use-cases/get-lessons-by-language-with-submissions-use-case/get-lessons-by-language-with-submissions-use-case';
import { GetLessonVariantsUseCase } from './application/use-cases/get-lesson-variants-use-case/get-lesson-variants-use-case';
import { CreateLessonVariantUseCase } from './application/use-cases/create-lesson-variant-use-case/create-lesson-variant-use-case';
import { GetLessonVariantUseCase } from './application/use-cases/get-lesson-variant-use-case/get-lesson-variant-use-case';
import { UpdateLessonVariantUseCase } from './application/use-cases/update-lesson-variant-use-case/update-lesson-variant-use-case';
import { DeleteLessonVariantUseCase } from './application/use-cases/delete-lesson-variant-use-case/delete-lesson-variant-use-case';
import { GetRegionalLessonUseCase } from './application/use-cases/get-regional-lesson-use-case/get-regional-lesson-use-case';
import { UpdateLessonuseCase } from './application/use-cases/update-lessonuse-case/update-lessonuse-case';
import { LessonController } from './infrastructure/controllers/lesson/lesson.controller';
import { LessonRepository } from './infrastructure/typeorm/lesson.repository/lesson.repository';
import { LessonVariantRepository } from './infrastructure/typeorm/lesson-variant.repository/lesson-variant.repository';
import { RegionRepository } from './infrastructure/typeorm/region.repository/region.repository';
import { ModeratorModule } from 'src/moderator/moderator.module';
import { AuthModule } from 'src/auth/auth.module';

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
    forwardRef(() => ModeratorModule),
    forwardRef(() => AuthModule),
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
