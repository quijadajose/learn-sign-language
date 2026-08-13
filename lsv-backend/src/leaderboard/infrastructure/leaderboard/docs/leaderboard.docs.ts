import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocOp } from 'src/shared/infrastructure/openapi/doc-op';
import { PaginatedLeaderboardResponseDto } from 'src/shared/infrastructure/openapi/resource-responses';

export const DocLeaderboard = () => applyDecorators(ApiTags('Leaderboard'));

export const DocGetGeneralLeaderboard = () =>
  DocOp({
    summary: 'Leaderboard general',
    description: 'Ranking paginado de puntajes.',
    okType: PaginatedLeaderboardResponseDto,
  });

export const DocGetLeaderboardByLanguage = () =>
  DocOp({
    summary: 'Leaderboard por lenguaje',
    notFound: true,
    okType: PaginatedLeaderboardResponseDto,
  });
