import { Inject, Injectable } from '@nestjs/common';
import { LessonRepositoryInterface } from 'src/lesson/domain/ports/lesson.repository.interface/lesson.repository.interface';
import { UserLanguage } from 'src/shared/domain/entities/userLanguage';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { EnrollUserInLanguageUseCase } from 'src/users/infrastructure/users/enroll-user-in-language.use-case';
import { GetUserLanguagesUseCase } from '../use-cases/get-user-languages/get-user-languages.use-case';
import { StageRepositoryInterface } from 'src/stage/domain/ports/stage.repository.interface/stage.repository.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
    @Inject('StageRepositoryInterface')
    private readonly stageRepository: StageRepositoryInterface,
    private readonly enrollUserInLanguageUseCase: EnrollUserInLanguageUseCase,
    private readonly getUserLanguagesUseCase: GetUserLanguagesUseCase,
  ) {}

  findUserLanguages(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserLanguage>> {
    return this.getUserLanguagesUseCase.execute(userId, pagination);
  }

  enrollUserInLanguage(
    userId: string,
    languageId: string,
  ): Promise<UserLanguage> {
    return this.enrollUserInLanguageUseCase.execute(userId, languageId);
  }

  async getStagesProgress(userId: string, languageId: string): Promise<any> {
    return this.stageRepository.getStagesProgressForUser(userId, languageId);
  }
}
