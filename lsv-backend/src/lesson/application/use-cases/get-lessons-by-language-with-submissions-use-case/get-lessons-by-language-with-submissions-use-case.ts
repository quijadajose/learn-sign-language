import { Injectable, Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { Lesson } from '../../../../shared/domain/entities/lesson.js';

@Injectable()
export class GetLessonsByLanguageWithSubmissionsUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}

  async execute(
    languageId: string,
    userId: string,
    pagination: PaginationDto,
    stageId?: string,
    regionId?: string,
  ): Promise<PaginatedResponseDto<Lesson>> {
    return await this.lessonRepository.getLessonsByLanguageWithSubmissions(
      languageId,
      userId,
      pagination,
      stageId,
      regionId,
    );
  }
}
