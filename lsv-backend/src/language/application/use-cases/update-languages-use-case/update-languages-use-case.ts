import { BadRequestException, Inject } from '@nestjs/common';
import { LanguageRepositoryInterface } from 'src/language/domain/ports/language.repository.interface/language.repository.interface';
import { CreateLanguageDto } from '../../../domain/dtos/create-language/create-language';

export class UpdateLanguagesUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
  ) {}
  async execute(
    updateLanguageDto: CreateLanguageDto,
    id: string,
  ): Promise<any> {
    const { name } = updateLanguageDto;

    const existingLanguage = await this.languageRepository.findByName(name);

    if (existingLanguage) {
      throw new BadRequestException('Language already in use');
    }
    const language = await this.languageRepository.update(
      id,
      updateLanguageDto,
    );
    return language;
  }
}
