import { User } from '../../../shared/domain/entities/user.js';
import { Region } from '../../../shared/domain/entities/region.js';
import { UserRegion } from '../../../shared/domain/entities/userRegion.js';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../shared/domain/dto/PaginationDto.js';

export interface UserRegionRepositoryInterface {
  findRegionsByUserId(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserRegion>>;
  findRegionsByUserIdAndLanguageId(
    userId: string,
    languageId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserRegion>>;
  save(user: User, region: Region): Promise<UserRegion>;
  findByUserIdAndRegionId(
    userId: string,
    regionId: string,
  ): Promise<UserRegion | null>;
  delete(userId: string, regionId: string): Promise<void>;
}
