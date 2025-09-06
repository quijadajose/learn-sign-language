import { Inject } from '@nestjs/common';
import { QuizRepositoryInterface } from 'src/quiz/domain/ports/quiz.repository.interface/quiz.repository.interface';

export class DeleteQuizUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepository: QuizRepositoryInterface,
  ) {}
  async execute(id: string): Promise<void> {
    return await this.quizRepository.deleteById(id);
  }
}
