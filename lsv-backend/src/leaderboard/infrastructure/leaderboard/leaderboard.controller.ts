import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from 'src/leaderboard/application/service/leaderboard/leaderboard.service';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}
  @Get('/')
  async getGeneralLeaderboard(@Query() pagination: PaginationDto) {
    return this.leaderboardService.getLeaderboard(pagination);
  }
}
