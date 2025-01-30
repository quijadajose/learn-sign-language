import { CreateLanguageDto } from 'src/admin/application/dtos/create-language/create-language';
import { UpdateLanguageDto } from 'src/admin/application/dtos/update-language-dto/update-language-dto';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { Language } from 'src/shared/domain/entities/language';

export interface LanguageRepositoryInterface {
  findById(id: string): Promise<Language | null>;
  findByName(name: string): Promise<Language | null>;
  findAll(pagination: PaginationDto): Promise<Language[]>;
  save(language: Language): Promise<Language>;
  deleteById(id: string): Promise<void>;
  update(id: string, language: CreateLanguageDto): Promise<Language>;
}
