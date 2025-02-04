import { BadRequestException, Inject } from "@nestjs/common";
import { StageRepositoryInterface } from "src/admin/domain/ports/stage.repository.interface/stage.repository.interface";
import { CreateStageDto } from "../../dtos/create-stage-dto/create-stage-dto";
import { LanguageRepositoryInterface } from "src/admin/domain/ports/language.repository.interface/language.repository.interface";
import { Stages } from "src/shared/domain/entities/stage";

export class CreateStageUseCase {
    constructor(
        @Inject('LanguageRepositoryInterface')
        private readonly languageRepository: LanguageRepositoryInterface,
        @Inject('StageRepositoryInterface')
        private readonly stageRepository: StageRepositoryInterface,
    ) { }
    async execute(createstageDto: CreateStageDto): Promise<any> {
        const { name } = createstageDto;
        const language = await this.languageRepository.findById(createstageDto.languageId);
        const existingStage = await this.stageRepository.findByName(name);
        if (existingStage) {
            throw new BadRequestException('Stage already in use');
        }
        const stage = new Stages();
        stage.name = createstageDto.name;
        stage.description = createstageDto.description;
        stage.language = language;
        const createdStage = await this.stageRepository.save(stage);
        return createdStage;
    }
}
