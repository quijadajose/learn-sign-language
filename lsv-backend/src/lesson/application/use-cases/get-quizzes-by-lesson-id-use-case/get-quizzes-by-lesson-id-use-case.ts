import { Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from 'src/lesson/domain/ports/lesson.repository.interface/lesson.repository.interface';
import { Quiz } from 'src/shared/domain/entities/quiz';

export class GetQuizzesByLessonIdUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}
  execute(id: string): Promise<Quiz[]> {
    return this.lessonRepository.findQuizzesByLessonId(id);
  }
}
