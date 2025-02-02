import { CreateStageDto } from "src/admin/application/dtos/create-stage-dto/create-stage-dto";
import { PaginationDto } from "src/shared/application/dtos/PaginationDto";
import { Stages } from "src/shared/domain/entities/stage";

export interface StageRepositoryInterface{
    findById(id: string): Promise<Stages | null>;
    findByName(name: string): Promise<Stages | null>;
    findAll(pagination: PaginationDto): Promise<Stages[]>;
    save(stage: Stages): Promise<Stages>;
    deleteById(id: string): Promise<void>;
    update(id: string, stage: CreateStageDto): Promise<Stages>;
}