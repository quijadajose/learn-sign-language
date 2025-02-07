import { Injectable } from '@nestjs/common';
import { GetUserLessonByUserIdUseCase } from '../../use-cases/get-user-lesson-by-user-id-use-case/get-user-lesson-by-user-id-use-case';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { UserLesson } from 'src/shared/domain/entities/userLesson';
import { StartLessonUseCase } from '../../use-cases/start-lesson-use-case/start-lesson-use-case';
import { SetLessonCompletionUseCase } from '../../use-cases/set-lesson-completion-use-case/set-lesson-completion-use-case';

@Injectable()
export class UserLessonService {
  constructor(
    private readonly getUserLessonByUserIdUseCase: GetUserLessonByUserIdUseCase,
    private readonly startLessonUseCase: StartLessonUseCase,
    private readonly setLessonCompletionUseCase: SetLessonCompletionUseCase,
  ) {}
  getUserLessonByUserId(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<UserLesson[]> {
    return this.getUserLessonByUserIdUseCase.execute(userId, paginationDto);
  }
  startLesson(userId: string, lessonId: string) {
    this.startLessonUseCase.execute(userId, lessonId);
  }
  setLessonCompletion(userId: string, lessonId: string, isCompleted: boolean) {
    this.setLessonCompletionUseCase.execute(userId, lessonId, isCompleted);
  }
}
