import { Injectable } from '@nestjs/common';
import { GetGeneralLeaderboardUseCase } from '../../use-cases/get-general-leaderboard-use-case/get-general-leaderboard-use-case.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { GetLeaderboardByLanguageUseCase } from '../../use-cases/get-leaderboard-by-language-use-case/get-leaderboard-by-language-use-case.js';
import { LeaderboardDto } from '../../../domain/dto/leaderboard/leaderboard.js';

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
