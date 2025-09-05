import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { Language } from 'src/shared/domain/entities/language';
import { User } from 'src/shared/domain/entities/user';
import { UserLanguage } from 'src/shared/domain/entities/userLanguage';

export interface UserLanguageRepositoryInterface {
  findLanguagesByUserId(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserLanguage>>;
  save(user: User, language: Language): Promise<UserLanguage>;
}
