import { BadRequestException, Inject } from '@nestjs/common';
import { LanguageRepositoryInterface } from '../../../../language/domain/ports/language.repository.interface/language.repository.interface.js';
import { StageRepositoryInterface } from '../../../domain/ports/stage.repository.interface/stage.repository.interface.js';
import { StageDto } from '../../../../shared/domain/dto/create-stage/create-stage-dto.js';
import { Stages } from '../../../../shared/domain/entities/stage.js';

export class CreateStageUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
    @Inject('StageRepositoryInterface')
    private readonly stageRepository: StageRepositoryInterface,
  ) {}
  async execute(createstageDto: StageDto): Promise<Stages> {
    const { name } = createstageDto;
    const language = await this.languageRepository.findById(
      createstageDto.languageId,
    );
    const existingStage = await this.stageRepository.findByNameInLanguage(
      name,
      createstageDto.languageId,
    );
    if (existingStage) {
      throw new BadRequestException('errors.stage.alreadyInUse');
    }
    const stage = new Stages();
    stage.name = createstageDto.name;
    stage.description = createstageDto.description;
    stage.language = language;
    const createdStage = await this.stageRepository.save(stage);
    return createdStage;
  }
}
