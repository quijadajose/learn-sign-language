import { LeaderboardDto } from 'src/leaderboard/domain/dto/leaderboard/leaderboard';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';

export interface LeaderboardRepositoryInterface {
  getGlobalLeaderboard(limit: number): Promise<LeaderboardDto[]>;
  getLeaderboardByLanguage(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<LeaderboardDto[]>;
}
