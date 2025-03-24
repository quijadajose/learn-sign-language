import { Injectable, NotFoundException } from '@nestjs/common';
import { GetUserLessonByUserIdUseCase } from '../../use-cases/get-user-lesson-by-user-id-use-case/get-user-lesson-by-user-id-use-case';
import { PaginationDto } from 'src/shared/domain/dtos/PaginationDto';
import { UserLesson } from 'src/shared/domain/entities/userLesson';
import { StartLessonUseCase } from '../../use-cases/start-lesson-use-case/start-lesson-use-case';
import { SetLessonCompletionUseCase } from '../../use-cases/set-lesson-completion-use-case/set-lesson-completion-use-case';
import { FindUserUseCase } from 'src/auth/domain/use-cases/find-user/find-user';
import { GetLessonByIdUseCase } from 'src/lesson/application/use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case';

@Injectable()
export class UserLessonService {
  constructor(
    private readonly getUserLessonByUserIdUseCase: GetUserLessonByUserIdUseCase,
    private readonly startLessonUseCase: StartLessonUseCase,
    private readonly setLessonCompletionUseCase: SetLessonCompletionUseCase,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly getLessonByIdUseCase: GetLessonByIdUseCase,
  ) {}
  getUserLessonByUserId(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<UserLesson[]> {
    return this.getUserLessonByUserIdUseCase.execute(userId, paginationDto);
  }
  async startLesson(userId: string, lessonId: string) {
    const user = await this.findUserUseCase.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const lesson = await this.getLessonByIdUseCase.execute(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }
    this.startLessonUseCase.execute(userId, lessonId);
  }
  setLessonCompletion(userId: string, lessonId: string, isCompleted: boolean) {
    this.setLessonCompletionUseCase.execute(userId, lessonId, isCompleted);
  }
}
