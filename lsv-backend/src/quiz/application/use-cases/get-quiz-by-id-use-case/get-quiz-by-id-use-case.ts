import { Inject } from '@nestjs/common';
import { stripQuizAnswerFlags } from '../../../../lesson/domain/strip-quiz-answers.js';
import { QuizRepositoryInterface } from '../../../domain/ports/quiz.repository.interface/quiz.repository.interface.js';

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
