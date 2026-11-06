import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  ConflictException,
} from '@nestjs/common';
import {
  ModeratorPermission,
  PermissionScope,
} from '../../../../shared/domain/entities/moderatorPermission.js';
import { ModeratorPermissionRepositoryInterface } from '../../../domain/ports/moderator-permission.repository.interface.js';
import { AssignPermissionDto } from '../../../domain/dto/assign-permission.dto.js';
import { LanguageRepositoryInterface } from '../../../../language/domain/ports/language.repository.interface/language.repository.interface.js';
import { RegionRepositoryInterface } from '../../../../region/domain/region.repository.interface.js';
import { UserRepositoryInterface } from '../../../../auth/domain/ports/user.repository.interface/user.repository.interface.js';

@Injectable()
export class AssignPermissionUseCase {
  constructor(
    @Inject('ModeratorPermissionRepositoryInterface')
    private readonly moderatorPermissionRepository: ModeratorPermissionRepositoryInterface,
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
    @Inject('RegionRepositoryInterface')
    private readonly regionRepository: RegionRepositoryInterface,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(dto: AssignPermissionDto): Promise<ModeratorPermission> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundException('errors.user.notFound');
    }

    // Verificar que el target existe y corresponde al scope
    if (dto.scope === PermissionScope.LANGUAGE) {
      const language = await this.languageRepository.findById(dto.targetId);
      if (!language) {
        throw new NotFoundException('errors.language.notFound');
      }

      // Verificar si ya existe un permiso para este usuario y lenguaje
      const existing =
        await this.moderatorPermissionRepository.findByUserIdAndLanguageId(
          dto.userId,
          dto.targetId,
        );
      if (existing) {
        throw new ConflictException(
          'User already has permission for this language',
        );
      }

      const permission = new ModeratorPermission();
      permission.userId = dto.userId;
      permission.scope = PermissionScope.LANGUAGE;
      permission.languageId = dto.targetId;
      const saved = await this.moderatorPermissionRepository.save(permission);
      await this.syncModeratorRole(user);
      return saved;
    }

    if (dto.scope === PermissionScope.REGION) {
      const region = await this.regionRepository.findById(dto.targetId);
      if (!region) {
        throw new NotFoundException('errors.region.notFound');
      }

      // Verificar si ya existe un permiso para este usuario y región
      const existing =
        await this.moderatorPermissionRepository.findByUserIdAndRegionId(
          dto.userId,
          dto.targetId,
        );
      if (existing) {
        throw new ConflictException(
          'User already has permission for this region',
        );
      }

      const permission = new ModeratorPermission();
      permission.userId = dto.userId;
      permission.scope = PermissionScope.REGION;
      permission.regionId = dto.targetId;
      const saved = await this.moderatorPermissionRepository.save(permission);
      await this.syncModeratorRole(user);
      return saved;
    }

    throw new BadRequestException('errors.permission.invalidScope');
  }

  /**
   * BE-03: el rol `moderator` se asigna al primer permiso (los guards de Sign Studio
   * y de imágenes lo exigen). Admin nunca se degrada.
   */
  private async syncModeratorRole(user: { id: string; role: string }) {
    if (user.role === 'user') {
      const fresh = await this.userRepository.findById(user.id);
      if (fresh && fresh.role === 'user') {
        fresh.role = 'moderator';
        await this.userRepository.save(fresh);
      }
    }
  }
}
