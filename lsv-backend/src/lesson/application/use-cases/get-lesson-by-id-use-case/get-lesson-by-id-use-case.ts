import { Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface.js';
import { Lesson } from '../../../../shared/domain/entities/lesson.js';

export class GetLessonByIdUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}
  execute(id: string): Promise<Lesson> {
    return this.lessonRepository.findById(id);
  }
}
