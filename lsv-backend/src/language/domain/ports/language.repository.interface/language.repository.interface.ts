import { CreateLanguageDto } from '../../dto/create-language/create-language.js';
import { PaginationDto } from '../../../../shared/domain/dto/PaginationDto.js';
import { Language } from '../../../../shared/domain/entities/language.js';

/** Cuánto contenido se pierde al borrar un idioma (AF-F4-02). */
export interface LanguageDeletionImpact {
  stages: number;
  lessons: number;
  quizzes: number;
  /** Señas que no se borran, pero quedan sin idioma (onDelete SET NULL). */
  signs: number;
}

export interface LanguageRepositoryInterface {
  findById(id: string): Promise<Language | null>;
  findByName(name: string): Promise<Language | null>;
  findAll(
    pagination: PaginationDto,
  ): Promise<{ data: Language[]; total: number }>;
  save(language: Language): Promise<Language>;
  deleteById(id: string): Promise<void>;
  countDeletionImpact(id: string): Promise<LanguageDeletionImpact>;
  update(id: string, language: CreateLanguageDto): Promise<Language>;
}
