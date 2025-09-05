import { Inject, Injectable } from '@nestjs/common';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { UserLanguage } from 'src/shared/domain/entities/userLanguage';
import { UserLanguageRepositoryInterface } from 'src/users/domain/ports/user-language.repository.interface';

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
