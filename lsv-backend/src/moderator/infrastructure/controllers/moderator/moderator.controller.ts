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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { ModeratorPermissionService } from 'src/moderator/application/services/moderator-permission/moderator-permission.service';
import { GetModeratorsDto } from 'src/moderator/domain/dto/get-moderators.dto';
import { PaginatedResponseDto } from 'src/shared/domain/dto/PaginationDto';
import { ModeratorListItem } from 'src/moderator/domain/dto/moderator-list-response.dto';
import { AssignPermissionDto } from 'src/moderator/domain/dto/assign-permission.dto';
import { ModeratorPermission } from 'src/shared/domain/entities/moderatorPermission';
import { UserRepositoryInterface } from 'src/auth/domain/ports/user.repository.interface/user.repository.interface';

@ApiTags('Moderators')
@Controller('admin/moderators')
@UseGuards(RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class ModeratorController {
  constructor(
    private readonly moderatorPermissionService: ModeratorPermissionService,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Listar moderadores',
    description:
      'Obtiene la lista paginada de moderadores con sus permisos. Puede filtrarse por languageId o regionId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de moderadores obtenida exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
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
  @ApiOperation({
    summary: 'Asignar permiso de moderación',
    description:
      'Asigna un permiso de moderación a un usuario para un lenguaje o región específica.',
  })
  @ApiResponse({
    status: 201,
    description: 'Permiso asignado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario, lenguaje o región no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya tiene este permiso',
  })
  async assignPermission(
    @Body() assignPermissionDto: AssignPermissionDto,
  ): Promise<ModeratorPermission> {
    return await this.moderatorPermissionService.assignPermission(
      assignPermissionDto,
    );
  }

  @Get('users/search')
  @ApiOperation({
    summary: 'Buscar usuarios',
    description:
      'Busca usuarios por email, nombre o apellido. Retorna hasta 10 resultados.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Término de búsqueda (email, nombre o apellido)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios encontrados',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
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
  @ApiOperation({
    summary: 'Revocar permiso de moderación',
    description: 'Revoca un permiso de moderación específico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Permiso revocado exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Se requiere rol de administrador',
  })
  @ApiResponse({
    status: 404,
    description: 'Permiso no encontrado',
  })
  async revokePermission(
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ): Promise<{ message: string }> {
    await this.moderatorPermissionService.revokePermission(permissionId);
    return { message: 'Permission revoked successfully' };
  }
}
