import { Inject } from '@nestjs/common';
import { LanguageRepositoryInterface } from 'src/language/domain/ports/language.repository.interface/language.repository.interface';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { Language } from 'src/shared/domain/entities/language';

export class ListLanguagesUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
  ) {}
  async execute(pagination: PaginationDto): Promise<Language[]> {
    const languages = await this.languageRepository.findAll(pagination);
    return languages;
  }
}
