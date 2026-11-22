import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
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
    const stage = await this.stageRepository.findById(id);
    if (!stage) {
      throw new NotFoundException('errors.stage.notFound');
    }

    // BE-06: la etapa no cambia de idioma en un PUT (un moderador no puede mover recursos a otro idioma).
    if (stage.language?.id !== languageId) {
      throw new BadRequestException('errors.stage.languageImmutable');
    }

    stage.name = name;
    stage.description = description;
    const createdStage = await this.stageRepository.save(stage);
    return createdStage;
  }
}
