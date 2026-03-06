import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ModeratorPermission,
  PermissionScope,
} from 'src/shared/domain/entities/moderatorPermission';
import { ModeratorPermissionRepositoryInterface } from 'src/moderator/domain/ports/moderator-permission.repository.interface';

@Injectable()
export class ModeratorPermissionRepository
  implements ModeratorPermissionRepositoryInterface
{
  private readonly secureSelect = {
    id: true as const,
    userId: true as const,
    scope: true as const,
    languageId: true as const,
    regionId: true as const,
    createdAt: true as const,
    user: {
      id: true as const,
      email: true as const,
      firstName: true as const,
      lastName: true as const,
      createdAt: true as const,
      age: true as const,
      isRightHanded: true as const,
      updatedAt: true as const,
      role: true as const,
    },
    language: {
      id: true as const,
      name: true as const,
      description: true as const,
      countryCode: true as const,
      createdAt: true as const,
      updatedAt: true as const,
    },
    region: {
      id: true as const,
      name: true as const,
      createdAt: true as const,
      updatedAt: true as const,
    },
  };

  constructor(
    @InjectRepository(ModeratorPermission)
    private readonly moderatorPermissionRepository: Repository<ModeratorPermission>,
  ) {}

  async findByUserId(userId: string): Promise<ModeratorPermission[]> {
    return this.moderatorPermissionRepository.find({
      where: { userId },
      relations: ['user', 'language', 'region'],
      select: this.secureSelect,
    });
  }

  async findByUserIdAndScope(
    userId: string,
    scope: PermissionScope,
  ): Promise<ModeratorPermission[]> {
    return this.moderatorPermissionRepository.find({
      where: { userId, scope },
      relations: ['user', 'language', 'region'],
      select: this.secureSelect,
    });
  }

  async findByUserIdAndLanguageId(
    userId: string,
    languageId: string,
  ): Promise<ModeratorPermission | null> {
    return this.moderatorPermissionRepository.findOne({
      where: { userId, scope: PermissionScope.LANGUAGE, languageId },
      relations: ['user', 'language'],
      select: {
        ...this.secureSelect,
        region: false,
      },
    } as any);
  }

  async findByUserIdAndRegionId(
    userId: string,
    regionId: string,
  ): Promise<ModeratorPermission | null> {
    return this.moderatorPermissionRepository.findOne({
      where: { userId, scope: PermissionScope.REGION, regionId },
      relations: ['user', 'region'],
      select: {
        ...this.secureSelect,
        language: false,
      },
    } as any);
  }

  async checkUserPermissionForLanguage(
    userId: string,
    languageId: string,
  ): Promise<boolean> {
    const permission = await this.moderatorPermissionRepository.findOne({
      where: [
        { userId, scope: PermissionScope.LANGUAGE, languageId },
        {
          userId,
          scope: PermissionScope.REGION,
          region: { languageId: languageId },
        },
      ],
      relations: ['region'],
    });

    return !!permission;
  }

  async findByLanguageId(languageId: string): Promise<ModeratorPermission[]> {
    return this.moderatorPermissionRepository.find({
      where: { scope: PermissionScope.LANGUAGE, languageId },
      relations: ['user', 'language'],
      select: {
        ...this.secureSelect,
        region: false,
      },
    } as any);
  }

  async findByRegionId(regionId: string): Promise<ModeratorPermission[]> {
    return this.moderatorPermissionRepository.find({
      where: { scope: PermissionScope.REGION, regionId },
      relations: ['user', 'region'],
      select: {
        ...this.secureSelect,
        language: false,
      },
    } as any);
  }

  async findById(id: string): Promise<ModeratorPermission | null> {
    return this.moderatorPermissionRepository.findOne({
      where: { id },
      relations: ['user', 'language', 'region'],
      select: this.secureSelect,
    });
  }

  async save(permission: ModeratorPermission): Promise<ModeratorPermission> {
    return this.moderatorPermissionRepository.save(permission);
  }

  async deleteById(id: string): Promise<void> {
    await this.moderatorPermissionRepository.delete(id);
  }

  async findWithFilters(
    pagination: { page: number; limit: number },
    languageId?: string,
    regionId?: string,
  ): Promise<[ModeratorPermission[], number]> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (languageId) {
      where.scope = PermissionScope.LANGUAGE;
      where.languageId = languageId;
    }
    if (regionId) {
      where.scope = PermissionScope.REGION;
      where.regionId = regionId;
    }

    return this.moderatorPermissionRepository.findAndCount({
      where,
      relations: ['user', 'language', 'region'],
      select: this.secureSelect,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }
}
