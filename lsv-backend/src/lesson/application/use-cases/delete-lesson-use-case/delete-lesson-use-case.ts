import { Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from 'src/lesson/domain/ports/lesson.repository.interface/lesson.repository.interface';

export class DeleteLessonUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}
  async execute(id: string) {
    return this.lessonRepository.deleteById(id);
  }
}
