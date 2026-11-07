import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { LeaderboardService } from '../../application/service/leaderboard/leaderboard.service.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../shared/domain/dto/PaginationDto.js';
import { LeaderboardDto } from '../../domain/dto/leaderboard/leaderboard.js';
import {
  DocGetGeneralLeaderboard,
  DocGetLeaderboardByLanguage,
  DocLeaderboard,
} from './docs/leaderboard.docs.js';

@DocLeaderboard()
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}
  @Get('/')
  @DocGetGeneralLeaderboard()
  async getGeneralLeaderboard(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>> {
    return this.leaderboardService.getLeaderboard(pagination);
  }
  @Get('language/:id')
  @DocGetLeaderboardByLanguage()
  async getLeaderboardByLanguage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>> {
    return this.leaderboardService.getLeaderboardByLanguage(id, pagination);
  }
}
