import { Module } from '@nestjs/common';
import { UserLessonRepository } from './infrastructure/typeorm/user-lesson.repository/user-lesson.repository';
import { UserLessonController } from './infrastructure/controllers/user-lesson/user-lesson.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLesson } from 'src/shared/domain/entities/userLesson';
import { GetUserLessonByUserIdUseCase } from './application/use-cases/get-user-lesson-by-user-id-use-case/get-user-lesson-by-user-id-use-case';
import { UserLessonService } from './application/services/user-lesson/user-lesson.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserLesson])],
  providers: [
    UserLessonService,
    GetUserLessonByUserIdUseCase,
    {
      provide: 'UserLessonRepositoryInterface',
      useClass: UserLessonRepository,
    },
  ],
  controllers: [UserLessonController],
})
export class UserLessonModule {}
