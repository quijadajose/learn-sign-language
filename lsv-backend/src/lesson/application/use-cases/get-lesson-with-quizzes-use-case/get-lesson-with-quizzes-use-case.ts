import { Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from 'src/lesson/domain/ports/lesson.repository.interface/lesson.repository.interface';
import { Lesson } from 'src/shared/domain/entities/lesson';

export class GetLessonWithQuizzesUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}
  execute(id: string): Promise<Lesson | null> {
    return this.lessonRepository.findByIdWithQuizzes(id);
  }
}
