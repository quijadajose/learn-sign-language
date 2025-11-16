import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { GetUserLessonByUserIdUseCase } from '../../use-cases/get-user-lesson-by-user-id-use-case/get-user-lesson-by-user-id-use-case';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
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
  ): Promise<UserLesson[]> {
    return this.getUserLessonByUserIdUseCase.execute(userId, paginationDto);
  }
  async startLesson(userId: string, lessonId: string, regionId?: string) {
    const user = await this.findUserUseCase.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    let baseLessonId = lessonId;

    // Si hay regionId, usar findRegionalLesson para obtener la lección base
    if (regionId) {
      try {
        const lessonOrVariant = await this.getRegionalLessonUseCase.execute(
          lessonId,
          regionId,
        );
        // Verificar si es una variante (tiene la propiedad baseLesson)
        if ('baseLesson' in lessonOrVariant && lessonOrVariant.baseLesson) {
          // Es una variante, usar el ID de la lección base
          baseLessonId = lessonOrVariant.baseLesson.id;
        } else {
          // Es una lección normal, usar su ID
          baseLessonId = (lessonOrVariant as any).id;
        }
      } catch (error) {
        throw new NotFoundException(
          `Lesson with ID ${lessonId} not found for region ${regionId}`,
        );
      }
    } else {
      const lesson = await this.getLessonByIdUseCase.execute(lessonId);
      if (!lesson) {
        throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
      }
      baseLessonId = lesson.id;
    }

    // Usar siempre el ID de la lección base para user_lesson
    this.startLessonUseCase.execute(userId, baseLessonId);
  }
  setLessonCompletion(userId: string, lessonId: string, isCompleted: boolean) {
    this.setLessonCompletionUseCase.execute(userId, lessonId, isCompleted);
  }
}
