import { Inject } from '@nestjs/common';
import { stripQuizAnswerFlags } from 'src/lesson/domain/strip-quiz-answers';
import { QuizRepositoryInterface } from 'src/quiz/domain/ports/quiz.repository.interface/quiz.repository.interface';

export class GetQuizByIdUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepositoryInterface,
  ) {}
  async execute(quizId: string) {
    const quiz = await this.quizRepositoryInterface.getQuizById(quizId);
    if (!quiz) {
      return quiz;
    }
    return stripQuizAnswerFlags(quiz);
  }
}
