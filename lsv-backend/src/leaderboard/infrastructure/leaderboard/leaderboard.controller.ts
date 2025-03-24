import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { LeaderboardService } from 'src/leaderboard/application/service/leaderboard/leaderboard.service';
import { PaginationDto } from 'src/shared/domain/dtos/PaginationDto';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}
  @Get('/')
  async getGeneralLeaderboard(@Query() pagination: PaginationDto) {
    return this.leaderboardService.getLeaderboard(pagination);
  }
  @Get('language/:id')
  async getLeaderboardByLanguage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.leaderboardService.getLeaderboardByLanguage(id, pagination);
  }
}
