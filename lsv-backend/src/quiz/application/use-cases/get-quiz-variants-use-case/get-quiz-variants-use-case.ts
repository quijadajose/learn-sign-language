import { Injectable, Inject } from '@nestjs/common';
import { QuizVariantRepositoryInterface } from 'src/quiz/domain/ports/quiz-variant.repository.interface';
import { QuizVariant } from 'src/shared/domain/entities/quizVariant';

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
