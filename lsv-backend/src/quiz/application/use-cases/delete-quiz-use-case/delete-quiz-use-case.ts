import { Inject } from '@nestjs/common';
import { QuizRepositoryInterface } from '../../../domain/ports/quiz.repository.interface/quiz.repository.interface.js';

export class DeleteQuizUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepository: QuizRepositoryInterface,
  ) {}
  async execute(id: string): Promise<void> {
    return await this.quizRepository.deleteById(id);
  }
}
