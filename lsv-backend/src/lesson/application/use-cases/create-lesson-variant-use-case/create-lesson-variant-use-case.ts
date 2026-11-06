import { Injectable, Inject } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface.js';
import { CreateLessonVariantDto } from '../../../domain/dto/create-lesson-variant/create-lesson-variant-dto.js';
import { LessonVariant } from '../../../../shared/domain/entities/lessonVariant.js';

@Injectable()
export class CreateLessonVariantUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}

  async execute(
    lessonId: string,
    createVariantDto: CreateLessonVariantDto,
  ): Promise<LessonVariant> {
    return await this.lessonRepository.createLessonVariant(
      lessonId,
      createVariantDto,
    );
  }
}
