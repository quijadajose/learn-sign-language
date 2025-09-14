import { Injectable, Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { LessonVariant } from 'src/shared/domain/entities/lessonVariant';

@Injectable()
export class GetRegionalLessonUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}

  async execute(
    lessonId: string,
    regionId?: string,
  ): Promise<Lesson | LessonVariant> {
    return await this.lessonRepository.findRegionalLesson(lessonId, regionId);
  }
}
