import { Inject } from '@nestjs/common';
import { CreateLessonDto } from '../../../domain/dto/create-lesson/create-lesson-dto.js';
import { Lesson } from '../../../../shared/domain/entities/lesson.js';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface.js';

export class UpdateLessonuseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}
  async execute(id: string, lesson: CreateLessonDto): Promise<Lesson> {
    await this.lessonRepository.update(id, lesson);
    return this.lessonRepository.findById(id);
  }
}
