import { Inject, NotFoundException } from '@nestjs/common';
import { LanguageRepositoryInterface } from '../../../domain/ports/language.repository.interface/language.repository.interface.js';
import { Language } from '../../../../shared/domain/entities/language.js';

export class GetLanguageUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
  ) {}
  async execute(id: string): Promise<Language> {
    const language = await this.languageRepository.findById(id);
    if (!language) {
      throw new NotFoundException('errors.language.notFound');
    }
    return language;
  }
}
