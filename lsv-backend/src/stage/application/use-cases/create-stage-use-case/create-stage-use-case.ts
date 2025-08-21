import { BadRequestException, Inject } from '@nestjs/common';
import { LanguageRepositoryInterface } from 'src/language/domain/ports/language.repository.interface/language.repository.interface';
import { StageRepositoryInterface } from 'src/stage/domain/ports/stage.repository.interface/stage.repository.interface';
import { StageDto } from '../../../../shared/domain/dto/create-stage/create-stage-dto';
import { Stages } from 'src/shared/domain/entities/stage';

export class CreateStageUseCase {
  constructor(
    @Inject('LanguageRepositoryInterface')
    private readonly languageRepository: LanguageRepositoryInterface,
    @Inject('StageRepositoryInterface')
    private readonly stageRepository: StageRepositoryInterface,
  ) {}
  async execute(createstageDto: StageDto): Promise<any> {
    const { name } = createstageDto;
    const language = await this.languageRepository.findById(
      createstageDto.languageId,
    );
    const existingStage = await this.stageRepository.findByNameInLanguage(
      name,
      createstageDto.languageId,
    );
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
