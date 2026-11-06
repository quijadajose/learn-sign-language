import { CreateLanguageDto } from '../../dto/create-language/create-language.js';
import { PaginationDto } from '../../../../shared/domain/dto/PaginationDto.js';
import { Language } from '../../../../shared/domain/entities/language.js';

export interface LanguageRepositoryInterface {
  findById(id: string): Promise<Language | null>;
  findByName(name: string): Promise<Language | null>;
  findAll(
    pagination: PaginationDto,
  ): Promise<{ data: Language[]; total: number }>;
  save(language: Language): Promise<Language>;
  deleteById(id: string): Promise<void>;
  update(id: string, language: CreateLanguageDto): Promise<Language>;
}
