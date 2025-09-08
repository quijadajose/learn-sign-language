import { Injectable, Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from 'src/lesson/domain/ports/lesson.repository.interface/lesson.repository.interface';
import {
  PaginationDto,
  PaginatedResponseDto,
} from 'src/shared/domain/dto/PaginationDto';
import { Lesson } from 'src/shared/domain/entities/lesson';

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
  ): Promise<PaginatedResponseDto<Lesson>> {
    return await this.lessonRepository.getLessonsByLanguageWithSubmissions(
      languageId,
      userId,
      pagination,
      stageId,
    );
  }
}
