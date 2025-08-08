import { Inject } from '@nestjs/common';
import { QuizRepositoryInterface } from 'src/quiz/domain/ports/quiz.repository.interface/quiz.repository.interface';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';

export class GetGeneralLeaderboardUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepositoryInterface,
  ) {}
  execute(pagination: PaginationDto) {
    return this.quizRepositoryInterface.getLeaderboard(pagination);
  }
}
