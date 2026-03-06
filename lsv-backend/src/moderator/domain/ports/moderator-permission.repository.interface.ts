import {
  ModeratorPermission,
  PermissionScope,
} from 'src/shared/domain/entities/moderatorPermission';

export interface ModeratorPermissionRepositoryInterface {
  findByUserId(userId: string): Promise<ModeratorPermission[]>;
  findByUserIdAndScope(
    userId: string,
    scope: PermissionScope,
  ): Promise<ModeratorPermission[]>;
  findByUserIdAndLanguageId(
    userId: string,
    languageId: string,
  ): Promise<ModeratorPermission | null>;
  findByUserIdAndRegionId(
    userId: string,
    regionId: string,
  ): Promise<ModeratorPermission | null>;
  checkUserPermissionForLanguage(
    userId: string,
    languageId: string,
  ): Promise<boolean>;
  findByLanguageId(languageId: string): Promise<ModeratorPermission[]>;
  findByRegionId(regionId: string): Promise<ModeratorPermission[]>;
  findById(id: string): Promise<ModeratorPermission | null>;
  save(permission: ModeratorPermission): Promise<ModeratorPermission>;
  deleteById(id: string): Promise<void>;
  findWithFilters(
    pagination: { page: number; limit: number },
    languageId?: string,
    regionId?: string,
  ): Promise<[ModeratorPermission[], number]>;
}
