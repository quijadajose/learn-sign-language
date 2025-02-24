import { LeaderboardDto } from 'src/leaderboard/application/dtos/leaderboard/leaderboard';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';

export interface LeaderboardRepositoryInterface {
  getGlobalLeaderboard(limit: number): Promise<LeaderboardDto[]>;
  getLeaderboardByLanguage(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<LeaderboardDto[]>;
}
