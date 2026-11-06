import { Inject, Injectable } from '@nestjs/common';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { UserLanguage } from '../../../../shared/domain/entities/userLanguage.js';
import { UserLanguageRepositoryInterface } from '../../../domain/ports/user-language.repository.interface.js';

@Injectable()
export class GetUserLanguagesUseCase {
  constructor(
    @Inject('UserLanguageRepositoryInterface')
    private readonly userLanguageRepository: UserLanguageRepositoryInterface,
  ) {}

  execute(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserLanguage>> {
    return this.userLanguageRepository.findLanguagesByUserId(
      userId,
      pagination,
    );
  }
}
