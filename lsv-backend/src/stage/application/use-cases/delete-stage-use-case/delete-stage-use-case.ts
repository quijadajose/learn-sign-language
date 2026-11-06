import { Inject } from '@nestjs/common';
import { StageRepositoryInterface } from '../../../domain/ports/stage.repository.interface/stage.repository.interface.js';

export class DeleteStageUseCase {
  constructor(
    @Inject('StageRepositoryInterface')
    private readonly stageRepository: StageRepositoryInterface,
  ) {}
  execute(id: string) {
    this.stageRepository.deleteById(id);
  }
}
