import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocOp } from '../../../../shared/infrastructure/openapi/doc-op.js';
import { PaginatedLeaderboardResponseDto } from '../../../../shared/infrastructure/openapi/resource-responses.js';

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
