import { Inject, Injectable } from '@nestjs/common';
import { SignRepositoryInterface } from 'src/sign-record/domain/ports/sign.repository.interface';

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
