import { Injectable, Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface.js';
import { LessonVariant } from '../../../../shared/domain/entities/lessonVariant.js';

@Injectable()
export class GetLessonVariantUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}

  async execute(lessonId: string, variantId: string): Promise<LessonVariant> {
    return await this.lessonRepository.findLessonVariant(lessonId, variantId);
  }
}
