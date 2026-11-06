import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { LanguageRepositoryInterface } from '../../../domain/ports/language.repository.interface/language.repository.interface.js';
import { CreateLanguageDto } from '../../../domain/dto/create-language/create-language.js';
import { Language } from '../../../../shared/domain/entities/language.js';

export class UpdateLanguagesUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
  ) {}
  async execute(
    updateLanguageDto: CreateLanguageDto,
    id: string,
  ): Promise<Language> {
    const { name } = updateLanguageDto;

    const languageToUpdate = await this.languageRepository.findById(id);
    if (!languageToUpdate) {
      throw new NotFoundException('errors.language.notFound');
    }

    const existingLanguageWithSameName =
      await this.languageRepository.findByName(name);

    if (
      existingLanguageWithSameName &&
      existingLanguageWithSameName.id !== id
    ) {
      throw new BadRequestException('errors.language.alreadyExists');
    }
    const updatedLanguage = await this.languageRepository.update(
      id,
      updateLanguageDto,
    );
    return updatedLanguage;
  }
}
