import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';

@Injectable()
export class DeleteModelUseCase {
  constructor(
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
  ) {}

  async execute(id: string) {
    const model = await this.lessonModelRepository.findOne({ where: { id } });
    if (!model) throw new NotFoundException('Modelo no encontrado');
    await this.lessonModelRepository.remove(model);
    return { success: true };
  }
}
