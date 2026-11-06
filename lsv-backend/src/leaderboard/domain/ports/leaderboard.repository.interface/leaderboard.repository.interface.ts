import { LeaderboardDto } from '../../dto/leaderboard/leaderboard.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../../shared/domain/dto/PaginationDto.js';

export interface LeaderboardRepositoryInterface {
  getGlobalLeaderboard(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>>;
  getLeaderboardByLanguage(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>>;
}
