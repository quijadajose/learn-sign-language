import { Injectable, Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface';
import { LessonVariant } from 'src/shared/domain/entities/lessonVariant';

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
