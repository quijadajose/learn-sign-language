import { Region } from 'src/shared/domain/entities/region';
import { CreateRegionDto } from './create-region.dto';
import {
  PaginationDto,
  PaginatedResponseDto,
} from 'src/shared/domain/dto/PaginationDto';

export interface RegionRepositoryInterface {
  findById(id: string): Promise<Region | null>;
  findAll(pagination: PaginationDto): Promise<PaginatedResponseDto<Region>>;
  findByLanguageId(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Region>>;
  save(region: Region): Promise<Region>;
  deleteById(id: string): Promise<void>;
  update(id: string, region: CreateRegionDto): Promise<Region>;
  findByCode(code: string): Promise<Region | null>;
  findDefaultRegion(): Promise<Region | null>;
}
