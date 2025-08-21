import { StageDto } from 'src/shared/domain/dto/create-stage/create-stage-dto';
import {
  PaginationDto,
  PaginatedResponseDto,
} from 'src/shared/domain/dto/PaginationDto';
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
  ): Promise<PaginatedResponseDto<Stages>>;
}
