import { Injectable, Inject } from '@nestjs/common';
import { QuizVariantRepositoryInterface } from 'src/quiz/domain/ports/quiz-variant.repository.interface';

@Injectable()
export class DeleteQuizVariantUseCase {
  constructor(
    @Inject('QuizVariantRepositoryInterface')
    private readonly quizVariantRepository: QuizVariantRepositoryInterface,
  ) {}

  async execute(id: string): Promise<void> {
    return await this.quizVariantRepository.delete(id);
  }
}
