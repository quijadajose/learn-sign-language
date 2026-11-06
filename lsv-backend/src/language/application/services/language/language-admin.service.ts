import { Injectable } from '@nestjs/common';
import { CreateLanguageUseCase } from '../../use-cases/create-language-use-case/create-language-use-case.js';
import { CreateLanguageDto } from '../../../domain/dto/create-language/create-language.js';
import { Language } from '../../../../shared/domain/entities/language.js';
import { GetLanguageUseCase } from '../../use-cases/get-language-use-case/get-language-use-case.js';
import { ListLanguagesUseCase } from '../../use-cases/list-languages-use-case/list-languages-use-case.js';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { UpdateLanguagesUseCase } from '../../use-cases/update-languages-use-case/update-languages-use-case.js';
import { DeleteLanguagesUseCase } from '../../use-cases/delete-languages-use-case/delete-languages-use-case.js';
import { GetStagesFromLanguageUseCase } from '../../../../stage/application/use-cases/get-stages-from-language-use-case/get-stages-from-language-use-case.js';
import { Stages } from '../../../../shared/domain/entities/stage.js';

@Injectable()
export class LanguageService {
  constructor(
    private readonly createLanguageUseCase: CreateLanguageUseCase,
    private readonly getLanguageUseCase: GetLanguageUseCase,
    private readonly listLanguagesUseCase: ListLanguagesUseCase,
    private readonly updateLanguageUseCase: UpdateLanguagesUseCase,
    private readonly removeLanguageUseCase: DeleteLanguagesUseCase,
    private readonly getStagesFromLanguageUseCase: GetStagesFromLanguageUseCase,
  ) {}
  async createLanguage(
    createLanguageDto: CreateLanguageDto,
  ): Promise<Language> {
    return this.createLanguageUseCase.execute(createLanguageDto);
  }
  async getLanguage(id: string): Promise<Language> {
    return this.getLanguageUseCase.execute(id);
  }
  async getAllLanguages(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Language>> {
    return this.listLanguagesUseCase.execute(pagination);
  }
  async updateLanguage(
    id: string,
    updateLanguageDto: CreateLanguageDto,
  ): Promise<Language> {
    return this.updateLanguageUseCase.execute(updateLanguageDto, id);
  }
  async removeLanguage(id: string): Promise<void> {
    return this.removeLanguageUseCase.execute(id);
  }
  async getStagesByLanguage(
    id: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Stages>> {
    return this.getStagesFromLanguageUseCase.execute(id, pagination);
  }
}
