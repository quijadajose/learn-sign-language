import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UserLanguageRepositoryInterface } from 'src/users/domain/ports/user-language.repository.interface';

@Injectable()
export class UnenrollUserFromLanguageUseCase {
  constructor(
    @Inject('UserLanguageRepositoryInterface')
    private readonly userLanguageRepository: UserLanguageRepositoryInterface,
  ) {}

  async execute(userId: string, languageId: string): Promise<void> {
    // Verificar que el usuario esté inscrito en el idioma
    const userLanguages =
      await this.userLanguageRepository.findLanguagesByUserId(userId, {
        page: 1,
        limit: 1000,
      });

    const isEnrolled = userLanguages.data.some(
      (ul) => ul.languageId === languageId,
    );

    if (!isEnrolled) {
      throw new NotFoundException('No estás inscrito en este idioma.');
    }

    // Verificar cuántos idiomas tiene el usuario ANTES de eliminar
    // Usamos userLanguages.total en lugar de hacer otra consulta para ser más eficiente
    const totalLanguages = userLanguages.total;

    if (totalLanguages <= 1) {
      throw new BadRequestException(
        'No puedes desinscribirte del último idioma. Debes tener al menos un idioma inscrito.',
      );
    }

    // Eliminar la inscripción
    await this.userLanguageRepository.delete(userId, languageId);
  }
}
