import { Injectable } from '@nestjs/common';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { StageDto } from '../../../../stage/application/dto/create-stage-dto/create-stage-dto';
import { GetStagesFromLanguageUseCase } from 'src/stage/application/use-cases/get-stages-from-language-use-case/get-stages-from-language-use-case';
import { CreateStageUseCase } from 'src/stage/application/use-cases/create-stage-use-case/create-stage-use-case';
import { UpdateStageUseCase } from 'src/stage/application/use-cases/update-stage-use-case/update-stage-use-case';
import { DeleteStageUseCase } from 'src/stage/application/use-cases/delete-stage-use-case/delete-stage-use-case';

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
  ): Promise<any> {
    return this.getStagesFromLanguageUseCase.execute(id, pagination);
  }
  async createStage(createStageDto: StageDto) {
    await this.createStageUseCase.execute(createStageDto);
  }
  async updateStage(id: string, createStageDto: StageDto) {
    return this.updateStageUseCase.execute(id, createStageDto);
  }
  async deleteStage(id: string) {
    return this.deleteStageUseCase.execute(id);
  }
}
