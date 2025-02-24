import { Inject } from '@nestjs/common';
import { QuizRepository } from 'src/quiz/infrastructure/typeorm/quiz.repository/quiz.repository';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';

export class GetGeneralLeaderboardUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepository,
  ) {}
  execute(pagination: PaginationDto) {
    return this.quizRepositoryInterface.getLeaderboard(pagination);
  }
}
