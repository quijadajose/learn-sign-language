import { Injectable, Inject } from '@nestjs/common';
import { QuizVariantRepositoryInterface } from '../../../domain/ports/quiz-variant.repository.interface.js';
import { QuizVariant } from '../../../../shared/domain/entities/quizVariant.js';

@Injectable()
export class GetQuizVariantsUseCase {
  constructor(
    @Inject('QuizVariantRepositoryInterface')
    private readonly quizVariantRepository: QuizVariantRepositoryInterface,
  ) {}

  async execute(lessonVariantId: string): Promise<QuizVariant[]> {
    return await this.quizVariantRepository.findByLessonVariantId(
      lessonVariantId,
    );
  }
}
