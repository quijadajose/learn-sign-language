import { Injectable, Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface.js';
import { LessonVariant } from '../../../../shared/domain/entities/lessonVariant.js';

@Injectable()
export class GetLessonVariantsUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}

  async execute(lessonId: string): Promise<LessonVariant[]> {
    return await this.lessonRepository.findLessonVariants(lessonId);
  }
}
