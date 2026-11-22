import { Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { Lesson } from '../../../../shared/domain/entities/lesson.js';

export class GetLessonByLanguageUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}
  execute(
    languageId: string,
    pagination: PaginationDto,
    stageId?: string,
  ): Promise<PaginatedResponseDto<Lesson>> {
    return this.lessonRepository.getLessonsByLanguage(
      languageId,
      pagination,
      stageId,
    );
  }
}
