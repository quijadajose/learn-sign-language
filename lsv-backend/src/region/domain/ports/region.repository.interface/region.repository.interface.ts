import { Region } from '../../../../shared/domain/entities/region.js';
import { CreateRegionDto } from '../../create-region.dto.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../../shared/domain/dto/PaginationDto.js';

export interface RegionRepositoryInterface {
  findById(id: string): Promise<Region | null>;
  findAll(pagination: PaginationDto): Promise<PaginatedResponseDto<Region>>;
  save(region: Region): Promise<Region>;
  deleteById(id: string): Promise<void>;
  update(id: string, region: CreateRegionDto): Promise<Region>;
  findByCode(code: string): Promise<Region | null>;
  findDefaultRegion(): Promise<Region | null>;
}
