import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeaderboardService } from '../../application/service/leaderboard/leaderboard.service.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../shared/domain/dto/PaginationDto.js';
import { LeaderboardDto } from '../../domain/dto/leaderboard/leaderboard.js';
import { AuthGuard } from '@nestjs/passport';
import {
  DocGetGeneralLeaderboard,
  DocGetLeaderboardByLanguage,
  DocLeaderboard,
} from './docs/leaderboard.docs.js';

@DocLeaderboard()
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}
  @UseGuards(AuthGuard('jwt'))
  @Get('/')
  @DocGetGeneralLeaderboard()
  async getGeneralLeaderboard(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>> {
    return this.leaderboardService.getLeaderboard(pagination);
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('language/:id')
  @DocGetLeaderboardByLanguage()
  async getLeaderboardByLanguage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>> {
    return this.leaderboardService.getLeaderboardByLanguage(id, pagination);
  }
}
