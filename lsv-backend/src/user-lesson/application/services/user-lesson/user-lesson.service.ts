import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { GetUserLessonByUserIdUseCase } from '../../use-cases/get-user-lesson-by-user-id-use-case/get-user-lesson-by-user-id-use-case';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { UserLesson } from 'src/shared/domain/entities/userLesson';
import { StartLessonUseCase } from '../../use-cases/start-lesson-use-case/start-lesson-use-case';
import { SetLessonCompletionUseCase } from '../../use-cases/set-lesson-completion-use-case/set-lesson-completion-use-case';
import { FindUserUseCase } from 'src/auth/domain/use-cases/find-user/find-user';
import { GetLessonByIdUseCase } from 'src/lesson/application/use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case';
import { GetRegionalLessonUseCase } from 'src/lesson/application/use-cases/get-regional-lesson-use-case/get-regional-lesson-use-case';

@Injectable()
export class UserLessonService {
  constructor(
    private readonly getUserLessonByUserIdUseCase: GetUserLessonByUserIdUseCase,
    private readonly startLessonUseCase: StartLessonUseCase,
    private readonly setLessonCompletionUseCase: SetLessonCompletionUseCase,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly getLessonByIdUseCase: GetLessonByIdUseCase,
    @Inject(GetRegionalLessonUseCase)
    private readonly getRegionalLessonUseCase: GetRegionalLessonUseCase,
  ) {}
  getUserLessonByUserId(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<UserLesson>> {
    return this.getUserLessonByUserIdUseCase.execute(userId, paginationDto);
  }
  async startLesson(userId: string, lessonId: string, regionId?: string) {
    const user = await this.findUserUseCase.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    let baseLessonId = lessonId;

    try {
      const lessonOrVariant = await this.getRegionalLessonUseCase.execute(
        lessonId,
        regionId,
      );
      // Si es una variante (tiene la propiedad baseLesson), usar el ID de la lección base
      if ('baseLesson' in lessonOrVariant && lessonOrVariant.baseLesson) {
        baseLessonId = lessonOrVariant.baseLesson.id;
      }
    } catch {
      throw new NotFoundException(
        `Lesson with ID ${lessonId} not found${regionId ? ` for region ${regionId}` : ''}`,
      );
    }

    // Usar siempre el ID de la lección base para user_lesson
    await this.startLessonUseCase.execute(userId, baseLessonId);
  }

  async setLessonCompletion(
    userId: string,
    lessonId: string,
    isCompleted: boolean,
  ) {
    let baseLessonId = lessonId;

    try {
      const lessonOrVariant = await this.getRegionalLessonUseCase.execute(
        lessonId,
      );
      // Si es una variante (tiene la propiedad baseLesson), usar el ID de la lección base
      if ('baseLesson' in lessonOrVariant && lessonOrVariant.baseLesson) {
        baseLessonId = lessonOrVariant.baseLesson.id;
      }
    } catch {
      // Si no se encuentra como lección ni como variante, lanzamos 404
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    await this.setLessonCompletionUseCase.execute(
      userId,
      baseLessonId,
      isCompleted,
    );
  }
}
