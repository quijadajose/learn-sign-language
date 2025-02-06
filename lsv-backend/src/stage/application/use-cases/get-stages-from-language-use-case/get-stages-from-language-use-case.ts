import { Inject } from '@nestjs/common';
import { StageRepository } from 'src/stage/infrastructure/typeorm/stage.repository/stage.repository';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { Stages } from 'src/shared/domain/entities/stage';

export class GetStagesFromLanguageUseCase {
  constructor(
    @Inject('StageRepositoryInterface')
    private readonly stageRepository: StageRepository,
  ) {}
  async execute(id: string, pagination: PaginationDto): Promise<Stages[]> {
    return await this.stageRepository.findStagesByLanguage(id, pagination);
  }
}
