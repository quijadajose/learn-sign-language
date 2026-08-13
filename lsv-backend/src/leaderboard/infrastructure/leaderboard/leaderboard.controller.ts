import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeaderboardService } from 'src/leaderboard/application/service/leaderboard/leaderboard.service';
import {
  PaginationDto,
  PaginatedResponseDto,
} from 'src/shared/domain/dto/PaginationDto';
import { LeaderboardDto } from 'src/leaderboard/domain/dto/leaderboard/leaderboard';
import { AuthGuard } from '@nestjs/passport';
import {
  DocGetGeneralLeaderboard,
  DocGetLeaderboardByLanguage,
  DocLeaderboard,
} from './docs/leaderboard.docs';

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
