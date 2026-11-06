import { Inject, Injectable } from '@nestjs/common';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { UserRegion } from '../../../../shared/domain/entities/userRegion.js';
import { UserRegionRepositoryInterface } from '../../../domain/ports/user-region.repository.interface.js';

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
