import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryInterface } from '../../../../auth/domain/ports/user.repository.interface/user.repository.interface.js';
import { LanguageRepositoryInterface } from '../../../../language/domain/ports/language.repository.interface/language.repository.interface.js';
import { UserLanguage } from '../../../../shared/domain/entities/userLanguage.js';
import { UserLanguageRepositoryInterface } from '../../../domain/ports/user-language.repository.interface.js';

@Injectable()
export class EnrollUserInLanguageUseCase {
  constructor(
    @Inject('UserLanguageRepositoryInterface')
    private readonly userLanguageRepository: UserLanguageRepositoryInterface,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
  ) {}

  async execute(userId: string, languageId: string): Promise<UserLanguage> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('errors.user.notFound');
    }

    const language = await this.languageRepository.findById(languageId);
    if (!language) {
      throw new NotFoundException('errors.language.notFound');
    }
    const result = await this.userLanguageRepository.save(user, language);
    return result;
  }
}
