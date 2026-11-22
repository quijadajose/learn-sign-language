import { Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface.js';
import { stripLessonQuizAnswers } from '../../../domain/strip-quiz-answers.js';
import { Lesson } from '../../../../shared/domain/entities/lesson.js';

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
