import { Injectable } from '@nestjs/common';
import { AssignPermissionUseCase } from '../../use-cases/assign-permission-use-case/assign-permission-use-case';
import { RevokePermissionUseCase } from '../../use-cases/revoke-permission-use-case/revoke-permission-use-case';
import { ListModeratorsUseCase } from '../../use-cases/list-moderators-use-case/list-moderators-use-case';
import { AssignPermissionDto } from 'src/moderator/domain/dto/assign-permission.dto';
import { ModeratorPermission } from 'src/shared/domain/entities/moderatorPermission';
import { PaginatedResponseDto } from 'src/shared/domain/dto/PaginationDto';
import { ModeratorListItem } from 'src/moderator/domain/dto/moderator-list-response.dto';

@Injectable()
export class ModeratorPermissionService {
  constructor(
    private readonly assignPermissionUseCase: AssignPermissionUseCase,
    private readonly revokePermissionUseCase: RevokePermissionUseCase,
    private readonly listModeratorsUseCase: ListModeratorsUseCase,
  ) {}

  async assignPermission(
    dto: AssignPermissionDto,
  ): Promise<ModeratorPermission> {
    return await this.assignPermissionUseCase.execute(dto);
  }

  async revokePermission(permissionId: string): Promise<void> {
    return await this.revokePermissionUseCase.execute(permissionId);
  }

  async listModerators(
    pagination: { page: number; limit: number },
    languageId?: string,
    regionId?: string,
  ): Promise<PaginatedResponseDto<ModeratorListItem>> {
    return await this.listModeratorsUseCase.execute(
      pagination,
      languageId,
      regionId,
    );
  }
}
