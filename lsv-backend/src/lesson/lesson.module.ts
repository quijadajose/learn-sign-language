import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguageModule } from 'src/language/language.module';
import { UploadPictureUseCase } from 'src/shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';
import { Language } from 'src/shared/domain/entities/language';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { QuizSubmission } from 'src/shared/domain/entities/quizSubmission';
import { Stages } from 'src/shared/domain/entities/stage';
import { LessonService } from './application/services/lesson/lesson.service';
import { CreateLessonUseCase } from './application/use-cases/create-lesson-use-case/create-lesson-use-case';
import { DeleteLessonUseCase } from './application/use-cases/delete-lesson-use-case/delete-lesson-use-case';
import { GetLessonByIdUseCase } from './application/use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case';
import { GetLessonByLanguageUseCase } from './application/use-cases/get-lesson-by-laguage-use-case/get-lesson-by-laguage-use-case';
import { UpdateLessonuseCase } from './application/use-cases/update-lessonuse-case/update-lessonuse-case';
import { LessonController } from './infrastructure/controllers/lesson/lesson.controller';
import { LessonRepository } from './infrastructure/typeorm/lesson.repository/lesson.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson, Stages, Language, QuizSubmission]),
    LanguageModule,
  ],
  providers: [
    LessonService,
    CreateLessonUseCase,
    UploadPictureUseCase,
    GetLessonByLanguageUseCase,
    GetLessonByIdUseCase,
    UpdateLessonuseCase,
    DeleteLessonUseCase,
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
    TypeOrmModule,
  ],
})
export class LessonModule {}
