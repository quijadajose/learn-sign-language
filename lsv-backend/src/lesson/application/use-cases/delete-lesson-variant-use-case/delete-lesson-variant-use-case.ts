import { Injectable, Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface';

@Injectable()
export class DeleteLessonVariantUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}

  async execute(lessonId: string, variantId: string): Promise<void> {
    return await this.lessonRepository.deleteLessonVariant(lessonId, variantId);
  }
}
