import { Inject, NotFoundException } from '@nestjs/common';
import { LanguageRepositoryInterface } from 'src/language/domain/ports/language.repository.interface/language.repository.interface';
import { Language } from 'src/shared/domain/entities/language';

export class GetLanguageUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
  ) { }
  async execute(id: string): Promise<Language> {
    const language = await this.languageRepository.findById(id);
    if (!language) {
      throw new NotFoundException('Language not found');
    }
    return language;
  }
}
