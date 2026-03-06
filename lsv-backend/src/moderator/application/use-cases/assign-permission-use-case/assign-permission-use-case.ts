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
} from 'src/shared/domain/entities/moderatorPermission';
import { ModeratorPermissionRepositoryInterface } from 'src/moderator/domain/ports/moderator-permission.repository.interface';
import { AssignPermissionDto } from 'src/moderator/domain/dto/assign-permission.dto';
import { LanguageRepositoryInterface } from 'src/language/domain/ports/language.repository.interface/language.repository.interface';
import { RegionRepositoryInterface } from 'src/region/domain/region.repository.interface';
import { UserRepositoryInterface } from 'src/auth/domain/ports/user.repository.interface/user.repository.interface';

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
      throw new NotFoundException('User not found');
    }

    // Verificar que el target existe y corresponde al scope
    if (dto.scope === PermissionScope.LANGUAGE) {
      const language = await this.languageRepository.findById(dto.targetId);
      if (!language) {
        throw new NotFoundException('Language not found');
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
      return await this.moderatorPermissionRepository.save(permission);
    }

    if (dto.scope === PermissionScope.REGION) {
      const region = await this.regionRepository.findById(dto.targetId);
      if (!region) {
        throw new NotFoundException('Region not found');
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
      return await this.moderatorPermissionRepository.save(permission);
    }

    throw new BadRequestException('Invalid scope');
  }
}
