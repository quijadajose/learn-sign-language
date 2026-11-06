import { Inject } from '@nestjs/common';
import { LanguageRepositoryInterface } from '../../../../language/domain/ports/language.repository.interface/language.repository.interface.js';
import { StageRepositoryInterface } from '../../../domain/ports/stage.repository.interface/stage.repository.interface.js';
import { StageDto } from '../../../../shared/domain/dto/create-stage/create-stage-dto.js';

export class UpdateStageUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
    @Inject('StageRepositoryInterface')
    private readonly stageRepository: StageRepositoryInterface,
  ) {}
  async execute(id: string, createStageDto: StageDto) {
    const { name, description, languageId } = createStageDto;
    const language = await this.languageRepository.findById(languageId);
    const stage = await this.stageRepository.findById(id);

    stage.name = name;
    stage.description = description;
    if (language) {
      stage.language = language;
    }
    const createdStage = await this.stageRepository.save(stage);
    return createdStage;
  }
}
