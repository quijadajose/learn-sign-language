import { Inject } from '@nestjs/common';
import { QuizRepository } from 'src/quiz/infrastructure/typeorm/quiz.repository/quiz.repository';
import { QuizDto } from '../../dtos/quiz-dto/quiz-dto';

export class CreateQuizWithQuestionsAndOptionsUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepository,
  ) {}
  execute(quizDto: QuizDto) {
    return this.quizRepositoryInterface.saveWithQuestionsAndOptions(quizDto);
  }
}
