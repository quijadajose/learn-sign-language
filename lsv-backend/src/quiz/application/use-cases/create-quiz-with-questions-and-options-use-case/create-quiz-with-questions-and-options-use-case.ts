import { Inject } from '@nestjs/common';
import { QuizDto } from '../../../domain/dto/quiz/quiz-dto';
import { QuizRepositoryInterface } from 'src/quiz/domain/ports/quiz.repository.interface/quiz.repository.interface';

export class CreateQuizWithQuestionsAndOptionsUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepositoryInterface,
  ) {}
  execute(quizDto: QuizDto) {
    return this.quizRepositoryInterface.saveWithQuestionsAndOptions(quizDto);
  }
}
