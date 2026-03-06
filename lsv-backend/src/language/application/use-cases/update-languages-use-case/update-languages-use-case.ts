import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { LanguageRepositoryInterface } from 'src/language/domain/ports/language.repository.interface/language.repository.interface';
import { CreateLanguageDto } from '../../../domain/dto/create-language/create-language';

export class UpdateLanguagesUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
  ) { }
  async execute(
    updateLanguageDto: CreateLanguageDto,
    id: string,
  ): Promise<any> {
    const { name } = updateLanguageDto;

    const languageToUpdate = await this.languageRepository.findById(id);
    if (!languageToUpdate) {
      throw new NotFoundException('Language not found');
    }

    const existingLanguageWithSameName = await this.languageRepository.findByName(name);

    if (existingLanguageWithSameName && existingLanguageWithSameName.id !== id) {
      throw new BadRequestException('Language with this name already exists');
    }
    const updatedLanguage = await this.languageRepository.update(
      id,
      updateLanguageDto as any,
    );
    return updatedLanguage;
  }
}
