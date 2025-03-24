import { CreateLanguageDto } from 'src/language/domain/dtos/create-language/create-language';
import { PaginationDto } from 'src/shared/domain/dtos/PaginationDto';
import { Language } from 'src/shared/domain/entities/language';

export interface LanguageRepositoryInterface {
  findById(id: string): Promise<Language | null>;
  findByName(name: string): Promise<Language | null>;
  findAll(pagination: PaginationDto): Promise<Language[]>;
  save(language: Language): Promise<Language>;
  deleteById(id: string): Promise<void>;
  update(id: string, language: CreateLanguageDto): Promise<Language>;
}
