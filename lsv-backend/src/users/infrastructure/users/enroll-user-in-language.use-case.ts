import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryInterface } from 'src/auth/domain/ports/user.repository.interface/user.repository.interface.interface';
import { LanguageRepositoryInterface } from 'src/language/domain/ports/language.repository.interface/language.repository.interface';
import { UserLanguage } from 'src/shared/domain/entities/userLanguage';
import { UserLanguageRepositoryInterface } from 'src/users/domain/ports/user-language.repository.interface';

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
      throw new NotFoundException('User not found');
    }

    const language = await this.languageRepository.findById(languageId);
    if (!language) {
      throw new NotFoundException('Language not found');
    }

    return this.userLanguageRepository.save(user, language);
  }
}
