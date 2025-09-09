import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { QuizDto } from 'src/quiz/domain/dto/quiz/quiz-dto';
import { QuizRepositoryInterface } from 'src/quiz/domain/ports/quiz.repository.interface/quiz.repository.interface';
import { Quiz } from 'src/shared/domain/entities/quiz';

@Injectable()
export class UpdateQuizUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepository: QuizRepositoryInterface,
  ) {}

  async execute(id: string, quizDto: QuizDto): Promise<Quiz> {
    const existingQuiz = await this.quizRepository.findById(id);
    if (!existingQuiz) {
      throw new NotFoundException('Quiz not found');
    }

    return await this.quizRepository.updateQuizWithQuestionsAndOptions(
      id,
      quizDto,
    );
  }
}
