import { Inject } from '@nestjs/common';
import { PaginationDto } from 'src/shared/domain/dtos/PaginationDto';
import { Stages } from 'src/shared/domain/entities/stage';
import { StageRepositoryInterface } from 'src/stage/domain/ports/stage.repository.interface/stage.repository.interface';

export class GetStagesFromLanguageUseCase {
  constructor(
    @Inject('StageRepositoryInterface')
    private readonly stageRepository: StageRepositoryInterface,
  ) {}
  async execute(id: string, pagination: PaginationDto): Promise<Stages[]> {
    return await this.stageRepository.findStagesByLanguage(id, pagination);
  }
}
