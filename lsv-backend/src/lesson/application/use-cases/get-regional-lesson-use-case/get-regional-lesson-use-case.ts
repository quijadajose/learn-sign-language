import { Injectable, Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface.js';
import { Lesson } from '../../../../shared/domain/entities/lesson.js';
import { LessonVariant } from '../../../../shared/domain/entities/lessonVariant.js';
import {
  stripLessonQuizAnswers,
  stripLessonVariantQuizAnswers,
} from '../../../domain/strip-quiz-answers.js';

@Injectable()
export class GetRegionalLessonUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}

  async execute(
    lessonId: string,
    regionId?: string,
  ): Promise<Lesson | LessonVariant> {
    const result = await this.lessonRepository.findRegionalLesson(
      lessonId,
      regionId,
    );
    // Endpoint público para alumnos: nunca exponer `isCorrect`.
    if (result && Array.isArray((result as Lesson).quizzes)) {
      return stripLessonQuizAnswers(result as Lesson);
    }
    if (result && Array.isArray((result as LessonVariant).quizVariants)) {
      return stripLessonVariantQuizAnswers(result as LessonVariant);
    }
    return result;
  }
}
