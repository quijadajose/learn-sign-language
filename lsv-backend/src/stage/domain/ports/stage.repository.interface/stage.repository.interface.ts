import { StageDto } from 'src/stage/application/dto/create-stage-dto/create-stage-dto';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { Stages } from 'src/shared/domain/entities/stage';

export interface StageRepositoryInterface {
  findById(id: string): Promise<Stages | null>;
  findByNameInLanguage(
    name: string,
    languageId: string,
  ): Promise<Stages | null>;
  findAll(pagination: PaginationDto): Promise<Stages[]>;
  save(stage: Stages): Promise<Stages>;
  deleteById(id: string): Promise<void>;
  update(id: string, stage: StageDto): Promise<Stages>;
  findStagesByLanguage(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<Stages[]>;
}
