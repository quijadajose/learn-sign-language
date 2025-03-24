import { LeaderboardDto } from 'src/leaderboard/domain/dtos/leaderboard/leaderboard';
import { PaginationDto } from 'src/shared/domain/dtos/PaginationDto';

export interface LeaderboardRepositoryInterface {
  getGlobalLeaderboard(limit: number): Promise<LeaderboardDto[]>;
  getLeaderboardByLanguage(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<LeaderboardDto[]>;
}
