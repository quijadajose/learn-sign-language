import { Injectable } from '@nestjs/common';
import { GetGeneralLeaderboardUseCase } from '../../use-cases/get-general-leaderboard-use-case/get-general-leaderboard-use-case';
import {
  PaginationDto,
  PaginatedResponseDto,
} from 'src/shared/domain/dto/PaginationDto';
import { GetLeaderboardByLanguageUseCase } from '../../use-cases/get-leaderboard-by-language-use-case/get-leaderboard-by-language-use-case';
import { LeaderboardDto } from 'src/leaderboard/domain/dto/leaderboard/leaderboard';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly getGeneralLeaderboardUseCase: GetGeneralLeaderboardUseCase,
    private readonly getLeaderboardByLanguageUseCase: GetLeaderboardByLanguageUseCase,
  ) {}
  getLeaderboard(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>> {
    return this.getGeneralLeaderboardUseCase.execute(pagination);
  }
  getLeaderboardByLanguage(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>> {
    return this.getLeaderboardByLanguageUseCase.execute(languageId, pagination);
  }
}
