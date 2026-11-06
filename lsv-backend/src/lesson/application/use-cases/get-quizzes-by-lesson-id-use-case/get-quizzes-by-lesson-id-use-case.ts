import { Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';

export class GetQuizzesByLessonIdUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}
  execute(id: string): Promise<Quiz[]> {
    return this.lessonRepository.findQuizzesByLessonId(id);
  }
}
