import { Inject } from '@nestjs/common';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { Stages } from '../../../../shared/domain/entities/stage.js';
import { StageRepositoryInterface } from '../../../domain/ports/stage.repository.interface/stage.repository.interface.js';

export class GetStagesFromLanguageUseCase {
  constructor(
    @Inject('StageRepositoryInterface')
    private readonly stageRepository: StageRepositoryInterface,
  ) {}
  async execute(
    id: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Stages>> {
    return await this.stageRepository.findStagesByLanguage(id, pagination);
  }
}
