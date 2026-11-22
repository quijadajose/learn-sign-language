import { Injectable } from '@nestjs/common';
import { GetStagesFromLanguageUseCase } from '../../use-cases/get-stages-from-language-use-case/get-stages-from-language-use-case.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { StageDto } from '../../../../shared/domain/dto/create-stage/create-stage-dto.js';
import { CreateStageUseCase } from '../../use-cases/create-stage-use-case/create-stage-use-case.js';
import { UpdateStageUseCase } from '../../use-cases/update-stage-use-case/update-stage-use-case.js';
import { DeleteStageUseCase } from '../../use-cases/delete-stage-use-case/delete-stage-use-case.js';
import { Stages } from '../../../../shared/domain/entities/stage.js';

@Injectable()
export class StageService {
  constructor(
    private readonly getStagesFromLanguageUseCase: GetStagesFromLanguageUseCase,
    private readonly createStageUseCase: CreateStageUseCase,
    private readonly updateStageUseCase: UpdateStageUseCase,
    private readonly deleteStageUseCase: DeleteStageUseCase,
  ) {}
  async getStagesByLanguage(
    id: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Stages>> {
    return this.getStagesFromLanguageUseCase.execute(id, pagination);
  }
  async createStage(createStageDto: StageDto) {
    return this.createStageUseCase.execute(createStageDto);
  }
  async updateStage(id: string, createStageDto: StageDto) {
    return this.updateStageUseCase.execute(id, createStageDto);
  }
  async deleteStage(id: string) {
    return this.deleteStageUseCase.execute(id);
  }
}
