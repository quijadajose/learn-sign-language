import { Module } from '@nestjs/common';
import { LessonController } from './infrastructure/controllers/lesson/lesson.controller';
import { LessonService } from './application/services/lesson/lesson.service';
import { CreateLessonUseCase } from './application/use-cases/create-lesson-use-case/create-lesson-use-case';
import { UploadPictureUseCase } from 'src/shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';
import { GetLessonByLaguageUseCase } from './application/use-cases/get-lesson-by-laguage-use-case/get-lesson-by-laguage-use-case';
import { GetLessonByIdUseCase } from './application/use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case';
import { UpdateLessonuseCase } from './application/use-cases/update-lessonuse-case/update-lessonuse-case';
import { DeleteLessonUseCase } from './application/use-cases/delete-lesson-use-case/delete-lesson-use-case';
import { LanguageModule } from 'src/language/language.module';

@Module({
  imports: [LanguageModule],
  providers: [
    LessonService,
    CreateLessonUseCase,
    UploadPictureUseCase,
    GetLessonByLaguageUseCase,
    GetLessonByIdUseCase,
    UpdateLessonuseCase,
    DeleteLessonUseCase,
  ],
  controllers: [LessonController],
  exports: [LessonService],
})
export class LessonModule {}
