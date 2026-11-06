import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { QuizDto } from '../../../domain/dto/quiz/quiz-dto.js';
import { QuizRepositoryInterface } from '../../../domain/ports/quiz.repository.interface/quiz.repository.interface.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';

@Injectable()
export class UpdateQuizUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepository: QuizRepositoryInterface,
  ) {}

  async execute(id: string, quizDto: QuizDto): Promise<Quiz> {
    const existingQuiz = await this.quizRepository.findById(id);
    if (!existingQuiz) {
      throw new NotFoundException('errors.quiz.notFound');
    }

    return await this.quizRepository.updateQuizWithQuestionsAndOptions(
      id,
      quizDto,
    );
  }
}
