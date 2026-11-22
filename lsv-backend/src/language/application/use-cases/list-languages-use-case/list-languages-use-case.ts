import { Inject } from '@nestjs/common';
import { LanguageRepositoryInterface } from '../../../domain/ports/language.repository.interface/language.repository.interface.js';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { Language } from '../../../../shared/domain/entities/language.js';

export class ListLanguagesUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
  ) {}
  async execute(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Language>> {
    const { data, total } = await this.languageRepository.findAll(pagination);
    return new PaginatedResponseDto(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }
}
