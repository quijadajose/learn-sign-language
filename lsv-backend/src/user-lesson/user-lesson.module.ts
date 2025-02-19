import { Module } from '@nestjs/common';
import { UserLessonRepository } from './infrastructure/typeorm/user-lesson.repository/user-lesson.repository';
import { UserLessonController } from './infrastructure/controllers/user-lesson/user-lesson.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLesson } from 'src/shared/domain/entities/userLesson';
import { GetUserLessonByUserIdUseCase } from './application/use-cases/get-user-lesson-by-user-id-use-case/get-user-lesson-by-user-id-use-case';
import { UserLessonService } from './application/services/user-lesson/user-lesson.service';
import { StartLessonUseCase } from './application/use-cases/start-lesson-use-case/start-lesson-use-case';
import { SetLessonCompletionUseCase } from './application/use-cases/set-lesson-completion-use-case/set-lesson-completion-use-case';
import { UserRepository } from 'src/auth/infrastructure/typeorm/user.repository/user.repository';
import { FindUserUseCase } from 'src/auth/domain/use-cases/find-user/find-user';
import { User } from 'src/shared/domain/entities/user';
import { LessonRepository } from 'src/lesson/infrastructure/typeorm/lesson.repository/lesson.repository';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { Stages } from 'src/shared/domain/entities/stage';
import { Language } from 'src/shared/domain/entities/language';
import { GetLessonByIdUseCase } from 'src/lesson/application/use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserLesson, Lesson, Stages, Language]),
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
    {
      provide: 'LessonRepositoryInterface',
      useClass: LessonRepository,
    },
  ],
  controllers: [UserLessonController],
})
export class UserLessonModule {}
