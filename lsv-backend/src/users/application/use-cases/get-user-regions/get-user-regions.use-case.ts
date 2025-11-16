import { Inject, Injectable } from '@nestjs/common';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { UserRegion } from 'src/shared/domain/entities/userRegion';
import { UserRegionRepositoryInterface } from 'src/users/domain/ports/user-region.repository.interface';

@Injectable()
export class GetUserRegionsUseCase {
  constructor(
    @Inject('UserRegionRepositoryInterface')
    private readonly userRegionRepository: UserRegionRepositoryInterface,
  ) {}

  execute(
    userId: string,
    pagination: PaginationDto,
    languageId?: string,
  ): Promise<PaginatedResponseDto<UserRegion>> {
    if (languageId) {
      return this.userRegionRepository.findRegionsByUserIdAndLanguageId(
        userId,
        languageId,
        pagination,
      );
    }
    return this.userRegionRepository.findRegionsByUserId(userId, pagination);
  }
}
