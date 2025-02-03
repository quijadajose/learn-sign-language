import { Inject } from "@nestjs/common";
import { StageRepositoryInterface } from "src/admin/domain/ports/stage.repository.interface/stage.repository.interface";
import { PaginationDto } from "src/shared/application/dtos/PaginationDto";
import { Stages } from "src/shared/domain/entities/stage";

export class GetStagesFromLanguageUseCase {
    constructor(
        @Inject('StageRepositoryInterface')
        private readonly stageRepository: StageRepositoryInterface,
    ) { }
    async execute(id:string,pagination: PaginationDto): Promise<Stages[]> {
        return await this.stageRepository.findStagesByLanguage(id,pagination);
    }
}
