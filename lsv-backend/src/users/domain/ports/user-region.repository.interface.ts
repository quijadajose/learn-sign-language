import { User } from 'src/shared/domain/entities/user';
import { Region } from 'src/shared/domain/entities/region';
import { UserRegion } from 'src/shared/domain/entities/userRegion';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';

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
