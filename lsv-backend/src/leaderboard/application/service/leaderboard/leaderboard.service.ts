import { Injectable } from '@nestjs/common';
import { GetGeneralLeaderboardUseCase } from '../../use-cases/get-general-leaderboard-use-case/get-general-leaderboard-use-case';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly getGeneralLeaderboardUseCase: GetGeneralLeaderboardUseCase,
  ) {}
  getLeaderboard(pagination: PaginationDto) {
    return this.getGeneralLeaderboardUseCase.execute(pagination);
  }
}
