import { BadRequestException, Inject } from '@nestjs/common';
import { CreateLanguageDto } from '../../../domain/dto/create-language/create-language.js';
import { Language } from '../../../../shared/domain/entities/language.js';
import { LanguageRepositoryInterface } from '../../../domain/ports/language.repository.interface/language.repository.interface.js';

export class CreateLanguageUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
  ) {}

  async execute(createLanguageDto: CreateLanguageDto): Promise<Language> {
    const { name } = createLanguageDto;

    const existingLanguage = await this.languageRepository.findByName(name);

    if (existingLanguage) {
      throw new BadRequestException('errors.language.alreadyInUse');
    }

    const language = new Language();
    language.name = createLanguageDto.name;
    language.description = createLanguageDto.description;
    language.countryCode = createLanguageDto.countryCode;
    const createdLanguage = await this.languageRepository.save(language);
    return createdLanguage;
  }
}
