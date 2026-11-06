import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Inject,
} from '@nestjs/common';
import { Roles } from '../../../../auth/infrastructure/decorators/roles.decorator.js';
import { RolesGuard } from '../../../../auth/infrastructure/guards/roles/roles.guard.js';
import { ModeratorPermissionService } from '../../../application/services/moderator-permission/moderator-permission.service.js';
import { GetModeratorsDto } from '../../../domain/dto/get-moderators.dto.js';
import { PaginatedResponseDto } from '../../../../shared/domain/dto/PaginationDto.js';
import { ModeratorListItem } from '../../../domain/dto/moderator-list-response.dto.js';
import { AssignPermissionDto } from '../../../domain/dto/assign-permission.dto.js';
import { ModeratorPermission } from '../../../../shared/domain/entities/moderatorPermission.js';
import { UserRepositoryInterface } from '../../../../auth/domain/ports/user.repository.interface/user.repository.interface.js';
import {
  DocAssignPermission,
  DocListModerators,
  DocModerator,
  DocRevokePermission,
  DocSearchUsers,
} from './docs/moderator.docs.js';

@DocModerator()
@Controller('admin/moderators')
@UseGuards(RolesGuard)
@Roles('admin')
export class ModeratorController {
  constructor(
    private readonly moderatorPermissionService: ModeratorPermissionService,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  @Get()
  @DocListModerators()
  async listModerators(
    @Query() query: GetModeratorsDto,
  ): Promise<PaginatedResponseDto<ModeratorListItem>> {
    const { languageId, regionId, ...pagination } = query;
    return await this.moderatorPermissionService.listModerators(
      pagination,
      languageId,
      regionId,
    );
  }

  @Post()
  @DocAssignPermission()
  async assignPermission(
    @Body() assignPermissionDto: AssignPermissionDto,
  ): Promise<ModeratorPermission> {
    return await this.moderatorPermissionService.assignPermission(
      assignPermissionDto,
    );
  }

  @Get('users/search')
  @DocSearchUsers()
  async searchUsers(@Query('q') query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }
    const users = await this.userRepository.searchUsers(query.trim());
    // Ocultar información sensible
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    }));
  }

  @Delete(':permissionId')
  @DocRevokePermission()
  async revokePermission(
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ): Promise<{ message: string }> {
    await this.moderatorPermissionService.revokePermission(permissionId);
    return { message: 'Permission revoked successfully' };
  }
}
