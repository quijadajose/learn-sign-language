import { Injectable } from '@nestjs/common';
import { GetStagesFromLanguageUseCase } from '../../use-cases/get-stages-from-language-use-case/get-stages-from-language-use-case';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';

@Injectable()
export class StageAdminService {
    constructor(private readonly getStagesFromLanguageUseCase:GetStagesFromLanguageUseCase) { }
    async getStagesByLanguage(id: string, pagination: PaginationDto): Promise<any> {
        return this.getStagesFromLanguageUseCase.execute(id, pagination);
    }
}
