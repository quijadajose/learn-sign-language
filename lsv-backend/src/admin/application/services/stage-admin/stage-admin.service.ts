import { Injectable } from '@nestjs/common';
import { GetStagesFromLanguageUseCase } from '../../use-cases/get-stages-from-language-use-case/get-stages-from-language-use-case';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { CreateStageUseCase } from '../../use-cases/create-stage-use-case/create-stage-use-case';
import { CreateStageDto } from '../../dtos/create-stage-dto/create-stage-dto';

@Injectable()
export class StageAdminService {
    constructor(
        private readonly getStagesFromLanguageUseCase:GetStagesFromLanguageUseCase,
        private readonly createStageUseCase: CreateStageUseCase
    ) { }
    async getStagesByLanguage(id: string, pagination: PaginationDto): Promise<any> {
        return this.getStagesFromLanguageUseCase.execute(id, pagination);
    }
    async createStage(createStageDto: CreateStageDto) {
        await this.createStageUseCase.execute(createStageDto);
    }
}
