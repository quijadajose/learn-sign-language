import { Inject, NotFoundException } from '@nestjs/common';
import { LessonRepositoryInterface } from '../../../domain/ports/lesson.repository.interface/lesson.repository.interface.js';
import { Lesson } from '../../../../shared/domain/entities/lesson.js';

export class GetLessonByIdUseCase {
  constructor(
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}
  /**
   * Una lección que no existe es 404. Antes se devolvía `null` y la respuesta llegaba como
   * 200 con cuerpo vacío, que el frontend tomaba como éxito (AF-F6-03).
   */
  async execute(id: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException('errors.lesson.notFound');
    }
    return lesson;
  }
}
