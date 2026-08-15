import { Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from 'src/lesson/domain/ports/lesson.repository.interface/lesson.repository.interface';
import { stripLessonQuizAnswers } from 'src/lesson/domain/strip-quiz-answers';
import { Lesson } from 'src/shared/domain/entities/lesson';

export class GetLessonWithQuizzesUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}
  async execute(id: string): Promise<Lesson | null> {
    const lesson = await this.lessonRepository.findByIdWithQuizzes(id);
    if (!lesson) {
      return null;
    }
    return stripLessonQuizAnswers(lesson);
  }
}
