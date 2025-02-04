import { BadRequestException, Inject } from "@nestjs/common";
import { LanguageRepositoryInterface } from "src/admin/domain/ports/language.repository.interface/language.repository.interface";
import { StageRepositoryInterface } from "src/admin/domain/ports/stage.repository.interface/stage.repository.interface";
import { CreateStageDto } from "../../dtos/create-stage-dto/create-stage-dto";

export class UpdateStageUseCase {
    constructor(
        @Inject('LanguageRepositoryInterface')
        private readonly languageRepository: LanguageRepositoryInterface,
        @Inject('StageRepositoryInterface')
        private readonly stageRepository: StageRepositoryInterface,
    ) { }
    async execute(id: string,createStageDto: CreateStageDto) {
        const { name, description, languageId } = createStageDto;
        const language = await this.languageRepository.findById(languageId);
        const stage = await this.stageRepository.findById(id);
        
        stage.name = name;
        stage.description = description;
        if(language){
            stage.language = language;
        }
        const createdStage = await this.stageRepository.save(stage);
        return createdStage;
    }
}
