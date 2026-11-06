import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { SignRepositoryInterface } from '../../../domain/ports/sign.repository.interface.js';
import { CreateSignDto } from '../../../domain/dto/sign-record.dto.js';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface.js';

@Injectable()
export class CreateSignUseCase {
  constructor(
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}

  async execute(data: CreateSignDto) {
    if (!data.name) {
      throw new BadRequestException('errors.sign.nameRequired');
    }
    if (!data.languageId) {
      throw new BadRequestException('errors.sign.languageIdRequired');
    }

    // BE-06: la lección debe ser del mismo idioma que la seña.
    if (data.lessonId) {
      const lesson = await this.lessonRepository.findById(data.lessonId);
      if (!lesson) {
        throw new BadRequestException('errors.lesson.notFound');
      }
      if (lesson.language?.id !== data.languageId) {
        throw new BadRequestException('errors.sign.lessonLanguageMismatch');
      }
    }

    const sign = this.signRepository.create({
      name: data.name,
      language: { id: data.languageId },
      lessons: data.lessonId ? [{ id: data.lessonId }] : [],
      isGlobal: data.isGlobal || false,
      detectionType: data.detectionType || 'static',
    });

    return this.signRepository.save(sign);
  }
}
