import { Injectable } from '@nestjs/common';
import { GetStagesFromLanguageUseCase } from '../../use-cases/get-stages-from-language-use-case/get-stages-from-language-use-case';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { CreateStageUseCase } from '../../use-cases/create-stage-use-case/create-stage-use-case';
import { CreateStageDto } from '../../dtos/create-stage-dto/create-stage-dto';
import { UpdateStageUseCase } from '../../use-cases/update-stage-use-case/update-stage-use-case';
import { DeleteStageUseCase } from '../../use-cases/delete-stage-use-case/delete-stage-use-case';

@Injectable()
export class StageAdminService {
    constructor(
        private readonly getStagesFromLanguageUseCase:GetStagesFromLanguageUseCase,
        private readonly createStageUseCase: CreateStageUseCase,
        private readonly updateStageUseCase: UpdateStageUseCase,
        private readonly deleteStageUseCase: DeleteStageUseCase
    ) { }
    async getStagesByLanguage(id: string, pagination: PaginationDto): Promise<any> {
        return this.getStagesFromLanguageUseCase.execute(id, pagination);
    }
    async createStage(createStageDto: CreateStageDto) {
        await this.createStageUseCase.execute(createStageDto);
    }
    async updateStage(id:string, createStageDto: CreateStageDto) {
        return this.updateStageUseCase.execute(id, createStageDto);
    }
    async deleteStage(id: string) {
        return this.deleteStageUseCase.execute(id);
    }
}
