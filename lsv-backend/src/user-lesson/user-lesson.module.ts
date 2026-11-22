import { Module } from '@nestjs/common';
import { UserLessonRepository } from './infrastructure/typeorm/user-lesson.repository/user-lesson.repository.js';
import { UserLessonController } from './infrastructure/controllers/user-lesson/user-lesson.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLesson } from '../shared/domain/entities/userLesson.js';
import { QuizSubmission } from '../shared/domain/entities/quizSubmission.js';
import { GetUserLessonByUserIdUseCase } from './application/use-cases/get-user-lesson-by-user-id-use-case/get-user-lesson-by-user-id-use-case.js';
import { UserLessonService } from './application/services/user-lesson/user-lesson.service.js';
import { StartLessonUseCase } from './application/use-cases/start-lesson-use-case/start-lesson-use-case.js';
import { SetLessonCompletionUseCase } from './application/use-cases/set-lesson-completion-use-case/set-lesson-completion-use-case.js';
import { UserRepository } from '../auth/infrastructure/typeorm/user.repository/user.repository.js';
import { FindUserUseCase } from '../auth/domain/use-cases/find-user/find-user.js';
import { User } from '../shared/domain/entities/user.js';
import { Lesson } from '../shared/domain/entities/lesson.js';
import { Stages } from '../shared/domain/entities/stage.js';
import { Language } from '../shared/domain/entities/language.js';
import { GetLessonByIdUseCase } from '../lesson/application/use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case.js';
import { LessonModule } from '../lesson/lesson.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserLesson,
      Lesson,
      Stages,
      Language,
      QuizSubmission,
    ]),
    LessonModule,
  ],
  providers: [
    UserLessonService,
    GetUserLessonByUserIdUseCase,
    StartLessonUseCase,
    SetLessonCompletionUseCase,
    FindUserUseCase,
    GetLessonByIdUseCase,
    {
      provide: 'UserLessonRepositoryInterface',
      useClass: UserLessonRepository,
    },
    {
      provide: 'UserRepositoryInterface',
      useClass: UserRepository,
    },
  ],
  controllers: [UserLessonController],
})
export class UserLessonModule {}
