import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../shared/domain/dto/PaginationDto.js';
import { Language } from '../../../shared/domain/entities/language.js';
import { User } from '../../../shared/domain/entities/user.js';
import { UserLanguage } from '../../../shared/domain/entities/userLanguage.js';

export interface UserLanguageRepositoryInterface {
  findLanguagesByUserId(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserLanguage>>;
  save(user: User, language: Language): Promise<UserLanguage>;
  delete(userId: string, languageId: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
}
