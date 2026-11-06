import { Inject } from '@nestjs/common';
import { QuizRepositoryInterface } from '../../../../quiz/domain/ports/quiz.repository.interface/quiz.repository.interface.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { LeaderboardDto } from '../../../domain/dto/leaderboard/leaderboard.js';

export class GetGeneralLeaderboardUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepositoryInterface,
  ) {}
  execute(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>> {
    return this.quizRepositoryInterface.getLeaderboard(pagination);
  }
}
