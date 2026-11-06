import { Inject, Injectable } from '@nestjs/common';
import { SignRepositoryInterface } from '../../../domain/ports/sign.repository.interface.js';

@Injectable()
export class GetSignsForLessonUseCase {
  constructor(
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
  ) {}

  async execute(lessonId: string, regionId?: string) {
    return this.signRepository.findForLessonWithRecordingsCount(
      lessonId,
      regionId,
    );
  }
}
