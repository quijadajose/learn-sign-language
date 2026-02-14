import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegionRepositoryInterface } from 'src/region/domain/region.repository.interface';
import { Region } from 'src/shared/domain/entities/region';
import { CreateRegionDto } from 'src/region/domain/create-region.dto';
import {
  PaginationDto,
  PaginatedResponseDto,
} from 'src/shared/domain/dto/PaginationDto';

@Injectable()
export class RegionRepository implements RegionRepositoryInterface {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
  ) { }

  async findById(id: string): Promise<Region | null> {
    return await this.regionRepository.findOne({
      where: { id },
      relations: ['language'],
    });
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Region>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await this.regionRepository.findAndCount({
      skip,
      take: limit,
      order: { name: 'ASC' },
      relations: ['language'],
    });

    return {
      data,
      total,
      page,
      pageSize: limit,
    };
  }

  async findByLanguageId(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Region>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await this.regionRepository.findAndCount({
      where: { languageId },
      skip,
      take: limit,
      order: { name: 'ASC' },
      relations: ['language'],
    });

    return {
      data,
      total,
      page,
      pageSize: limit,
    };
  }

  async save(region: Region): Promise<Region> {
    return await this.regionRepository.save(region);
  }

  async deleteById(id: string): Promise<void> {
    await this.regionRepository.delete(id);
  }

  async update(id: string, regionData: CreateRegionDto): Promise<Region> {
    await this.regionRepository.update(id, regionData);
    const updatedRegion = await this.regionRepository.findOne({
      where: { id },
      relations: ['language'],
    });
    if (!updatedRegion) {
      throw new Error('Region not found after update');
    }
    return updatedRegion;
  }

  async findByCode(code: string): Promise<Region | null> {
    return await this.regionRepository.findOne({
      where: { code },
      relations: ['language'],
    });
  }

  async findDefaultRegion(): Promise<Region | null> {
    return await this.regionRepository.findOne({
      where: { isDefault: true },
      relations: ['language'],
    });
  }

  async findDefaultByLanguageId(languageId: string): Promise<Region | null> {
    return await this.regionRepository.findOne({
      where: { isDefault: true, languageId },
      relations: ['language'],
    });
  }
}
