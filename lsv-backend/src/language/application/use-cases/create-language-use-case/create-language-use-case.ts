import { BadRequestException, Inject } from '@nestjs/common';
import { CreateLanguageDto } from '../../../domain/dto/create-language/create-language';
import { Language } from 'src/shared/domain/entities/language';
import { LanguageRepositoryInterface } from 'src/language/domain/ports/language.repository.interface/language.repository.interface';

export class CreateLanguageUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
  ) {}

  async execute(createLanguageDto: CreateLanguageDto): Promise<Language> {
    const { name } = createLanguageDto;

    const existingLanguage = await this.languageRepository.findByName(name);

    if (existingLanguage) {
      throw new BadRequestException('Language already in use');
    }

    const language = new Language();
    language.name = createLanguageDto.name;
    language.description = createLanguageDto.description;
    const createdLanguage = await this.languageRepository.save(language);
    return createdLanguage;
  }
}
