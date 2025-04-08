import { Inject } from '@nestjs/common';
import { QuizRepositoryInterface } from 'src/quiz/domain/ports/quiz.repository.interface/quiz.repository.interface';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';

export class listQuizzesByLanguageIdUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepositoryInterface,
  ) {}
  execute(languageId: string, pagination: PaginationDto) {
    return this.quizRepositoryInterface.listQuizzesByLanguageId(
      languageId,
      pagination,
    );
  }
}
