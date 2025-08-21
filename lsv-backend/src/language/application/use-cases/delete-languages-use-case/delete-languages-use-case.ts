import { NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { LanguageRepositoryInterface } from 'src/language/domain/ports/language.repository.interface/language.repository.interface';

export class DeleteLanguagesUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
  ) {}
  async execute(id: string): Promise<void> {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }

    const language = await this.languageRepository.findById(id);
    if (!language) {
      throw new NotFoundException('Language not found');
    }
    return this.languageRepository.deleteById(id);
  }
}
