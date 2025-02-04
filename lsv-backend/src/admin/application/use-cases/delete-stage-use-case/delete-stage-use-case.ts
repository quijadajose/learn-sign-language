import { Inject } from "@nestjs/common";
import { StageRepositoryInterface } from "src/admin/domain/ports/stage.repository.interface/stage.repository.interface";

export class DeleteStageUseCase {
    constructor(
        @Inject('StageRepositoryInterface')
        private readonly stageRepository: StageRepositoryInterface,
    ) { }
    execute(id: string) {
        this.stageRepository.deleteById(id);
    }
}
