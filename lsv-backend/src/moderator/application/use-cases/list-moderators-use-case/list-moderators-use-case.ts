import { Injectable, Inject } from '@nestjs/common';
import { ModeratorPermissionRepositoryInterface } from '../../../domain/ports/moderator-permission.repository.interface.js';
import { PaginatedResponseDto } from '../../../../shared/domain/dto/PaginationDto.js';
import { ModeratorListItem } from '../../../domain/dto/moderator-list-response.dto.js';

@Injectable()
export class ListModeratorsUseCase {
  constructor(
    @Inject('ModeratorPermissionRepositoryInterface')
    private readonly moderatorPermissionRepository: ModeratorPermissionRepositoryInterface,
  ) {}

  async execute(
    pagination: { page: number; limit: number },
    languageId?: string,
    regionId?: string,
  ): Promise<PaginatedResponseDto<ModeratorListItem>> {
    const [permissions, total] =
      await this.moderatorPermissionRepository.findWithFilters(
        pagination,
        languageId,
        regionId,
      );

    const data: ModeratorListItem[] = permissions.map((permission) => ({
      id: permission.id,
      userId: permission.userId,
      user: permission.user,
      scope: permission.scope,
      language: permission.language,
      region: permission.region,
      createdAt: permission.createdAt,
    }));

    return new PaginatedResponseDto(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }
}
