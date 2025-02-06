import { Inject } from '@nestjs/common';
import { LessonRepository } from 'src/lesson/infrastructure/typeorm/lesson.repository/lesson.repository';
import { CreateLessonDto } from '../../dtos/create-lesson-dto/create-lesson-dto';
import { Lesson } from 'src/shared/domain/entities/lesson';

export class UpdateLessonuseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepository,
  ) {}
  async execute(id: string, lesson: CreateLessonDto): Promise<Lesson> {
    await this.lessonRepository.update(id, lesson);
    return this.lessonRepository.findById(id);
  }
}
