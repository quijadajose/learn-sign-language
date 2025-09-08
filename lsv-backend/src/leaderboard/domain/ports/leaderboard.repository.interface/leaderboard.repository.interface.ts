import { LeaderboardDto } from 'src/leaderboard/domain/dto/leaderboard/leaderboard';
import {
  PaginationDto,
  PaginatedResponseDto,
} from 'src/shared/domain/dto/PaginationDto';

export interface LeaderboardRepositoryInterface {
  getGlobalLeaderboard(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>>;
  getLeaderboardByLanguage(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>>;
}
