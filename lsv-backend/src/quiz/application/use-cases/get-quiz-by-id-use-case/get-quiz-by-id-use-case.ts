import { Inject } from '@nestjs/common';
import { QuizRepositoryInterface } from 'src/quiz/domain/ports/quiz.repository.interface/quiz.repository.interface';

export class GetQuizByIdUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepositoryInterface,
  ) {}
  execute(quizId: string) {
    return this.quizRepositoryInterface.getQuizById(quizId);
  }
}
