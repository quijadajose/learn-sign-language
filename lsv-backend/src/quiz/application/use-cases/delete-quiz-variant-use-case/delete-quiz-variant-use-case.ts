import { Injectable, Inject } from '@nestjs/common';
import { QuizVariantRepositoryInterface } from '../../../domain/ports/quiz-variant.repository.interface.js';

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
