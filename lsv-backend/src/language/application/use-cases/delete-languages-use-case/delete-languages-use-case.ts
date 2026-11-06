import { NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { LanguageRepositoryInterface } from '../../../domain/ports/language.repository.interface/language.repository.interface.js';

export class DeleteLanguagesUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
  ) {}
  async execute(id: string): Promise<void> {
    if (!id) {
      throw new BadRequestException('errors.language.idRequired');
    }

    const language = await this.languageRepository.findById(id);
    if (!language) {
      throw new NotFoundException('errors.language.notFound');
    }
    return this.languageRepository.deleteById(id);
  }
}
