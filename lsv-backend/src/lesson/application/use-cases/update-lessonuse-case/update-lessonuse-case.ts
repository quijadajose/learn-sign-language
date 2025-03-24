import { Inject } from '@nestjs/common';
import { CreateLessonDto } from '../../../domain/dtos/create-lesson-dto/create-lesson-dto';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { LessonRepositoryInterface } from 'src/lesson/domain/ports/lesson.repository.interface/lesson.repository.interface';

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
