import { Inject, Injectable } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../lesson/domain/ports/lesson.repository.interface/lesson.repository.interface.js';
import { UserLanguage } from '../../../shared/domain/entities/userLanguage.js';
import { UserRegion } from '../../../shared/domain/entities/userRegion.js';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../shared/domain/dto/PaginationDto.js';
import { EnrollUserInLanguageUseCase } from '../use-cases/enroll-user-in-language/enroll-user-in-language.use-case.js';
import { EnrollUserInRegionUseCase } from '../use-cases/enroll-user-in-region/enroll-user-in-region.use-case.js';
import { GetUserLanguagesUseCase } from '../use-cases/get-user-languages/get-user-languages.use-case.js';
import { GetUserRegionsUseCase } from '../use-cases/get-user-regions/get-user-regions.use-case.js';
import { UnenrollUserFromLanguageUseCase } from '../use-cases/unenroll-user-from-language/unenroll-user-from-language.use-case.js';
import { UnenrollUserFromRegionUseCase } from '../use-cases/unenroll-user-from-region/unenroll-user-from-region.use-case.js';
import {
  StageProgressRow,
  StageRepositoryInterface,
} from '../../../stage/domain/ports/stage.repository.interface/stage.repository.interface.js';
import { UserRegionRepositoryInterface } from '../../domain/ports/user-region.repository.interface.js';

export interface UserLanguageWithRegions extends UserLanguage {
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
  ): Promise<PaginatedResponseDto<StageProgressRow>> {
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
