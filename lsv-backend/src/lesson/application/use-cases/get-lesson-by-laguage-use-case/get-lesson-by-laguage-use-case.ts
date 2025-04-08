import { Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from 'src/lesson/domain/ports/lesson.repository.interface/lesson.repository.interface';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { Lesson } from 'src/shared/domain/entities/lesson';

export class GetLessonByLanguageUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}
  execute(languageId: string, pagination: PaginationDto): Promise<Lesson[]> {
    return this.lessonRepository.getLessonsByLanguage(languageId, pagination);
  }
}
