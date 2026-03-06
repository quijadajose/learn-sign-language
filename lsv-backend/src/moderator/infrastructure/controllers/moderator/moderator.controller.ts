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
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { ModeratorPermissionService } from 'src/moderator/application/services/moderator-permission/moderator-permission.service';
import { GetModeratorsDto } from 'src/moderator/domain/dto/get-moderators.dto';
import { PaginatedResponseDto } from 'src/shared/domain/dto/PaginationDto';
import { ModeratorListItem } from 'src/moderator/domain/dto/moderator-list-response.dto';
import { AssignPermissionDto } from 'src/moderator/domain/dto/assign-permission.dto';
import { ModeratorPermission } from 'src/shared/domain/entities/moderatorPermission';
import { UserRepositoryInterface } from 'src/auth/domain/ports/user.repository.interface/user.repository.interface';
import {
  DocAssignPermission,
  DocListModerators,
  DocModerator,
  DocRevokePermission,
  DocSearchUsers,
} from './docs/moderator.docs';

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
