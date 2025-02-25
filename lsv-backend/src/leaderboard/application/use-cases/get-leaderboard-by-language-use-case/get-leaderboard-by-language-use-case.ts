import { Inject } from '@nestjs/common';
import { QuizRepository } from 'src/quiz/infrastructure/typeorm/quiz.repository/quiz.repository';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';

export class GetLeaderboardByLanguageUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepository,
  ) {}
  execute(languageId: string, pagination: PaginationDto) {
    return this.quizRepositoryInterface.getLeaderboardByLanguageId(
      languageId,
      pagination,
    );
  }
}
