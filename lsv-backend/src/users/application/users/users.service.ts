import { Inject, Injectable } from '@nestjs/common';
import { LessonRepositoryInterface } from 'src/lesson/domain/ports/lesson.repository.interface/lesson.repository.interface';
import { UserLanguage } from 'src/shared/domain/entities/userLanguage';
import { UserRegion } from 'src/shared/domain/entities/userRegion';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { EnrollUserInLanguageUseCase } from '../use-cases/enroll-user-in-language/enroll-user-in-language.use-case';
import { EnrollUserInRegionUseCase } from '../use-cases/enroll-user-in-region/enroll-user-in-region.use-case';
import { GetUserLanguagesUseCase } from '../use-cases/get-user-languages/get-user-languages.use-case';
import { GetUserRegionsUseCase } from '../use-cases/get-user-regions/get-user-regions.use-case';
import { UnenrollUserFromLanguageUseCase } from '../use-cases/unenroll-user-from-language/unenroll-user-from-language.use-case';
import { UnenrollUserFromRegionUseCase } from '../use-cases/unenroll-user-from-region/unenroll-user-from-region.use-case';
import { StageRepositoryInterface } from 'src/stage/domain/ports/stage.repository.interface/stage.repository.interface';
import { UserRegionRepositoryInterface } from 'src/users/domain/ports/user-region.repository.interface';

interface UserLanguageWithRegions extends UserLanguage {
  enrolledRegions?: UserRegion[];
}

@Injectable()
export class UsersService {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
    @Inject('StageRepositoryInterface')
    private readonly stageRepository: StageRepositoryInterface,
    private readonly enrollUserInLanguageUseCase: EnrollUserInLanguageUseCase,
    private readonly enrollUserInRegionUseCase: EnrollUserInRegionUseCase,
    private readonly getUserLanguagesUseCase: GetUserLanguagesUseCase,
    private readonly getUserRegionsUseCase: GetUserRegionsUseCase,
    private readonly unenrollUserFromLanguageUseCase: UnenrollUserFromLanguageUseCase,
    private readonly unenrollUserFromRegionUseCase: UnenrollUserFromRegionUseCase,
    @Inject('UserRegionRepositoryInterface')
    private readonly userRegionRepository: UserRegionRepositoryInterface,
  ) {}

  async findUserLanguages(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserLanguageWithRegions>> {
    const result = await this.getUserLanguagesUseCase.execute(
      userId,
      pagination,
    );

    // Obtener regiones enroladas para cada idioma
    const languagesWithRegions: UserLanguageWithRegions[] = await Promise.all(
      result.data.map(async (userLanguage) => {
        // Obtener todas las regiones enroladas para este idioma (sin paginación para obtener todas)
        const regionsResult =
          await this.userRegionRepository.findRegionsByUserIdAndLanguageId(
            userId,
            userLanguage.languageId,
            { page: 1, limit: 1000 }, // Límite alto para obtener todas las regiones
          );

        return {
          ...userLanguage,
          enrolledRegions: regionsResult.data,
        };
      }),
    );

    return {
      ...result,
      data: languagesWithRegions,
    };
  }

  enrollUserInLanguage(
    userId: string,
    languageId: string,
  ): Promise<UserLanguage> {
    return this.enrollUserInLanguageUseCase.execute(userId, languageId);
  }

  enrollUserInRegion(userId: string, regionId: string): Promise<UserRegion> {
    return this.enrollUserInRegionUseCase.execute(userId, regionId);
  }

  findUserRegions(
    userId: string,
    pagination: PaginationDto,
    languageId?: string,
  ): Promise<PaginatedResponseDto<UserRegion>> {
    return this.getUserRegionsUseCase.execute(userId, pagination, languageId);
  }

  async getStagesProgress(
    userId: string,
    languageId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<any>> {
    return this.stageRepository.getStagesProgressForUser(
      userId,
      languageId,
      pagination,
    );
  }

  async unenrollUserFromLanguage(
    userId: string,
    languageId: string,
  ): Promise<void> {
    return this.unenrollUserFromLanguageUseCase.execute(userId, languageId);
  }

  async unenrollUserFromRegion(
    userId: string,
    regionId: string,
  ): Promise<void> {
    return this.unenrollUserFromRegionUseCase.execute(userId, regionId);
  }
}
