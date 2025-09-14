import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from 'src/shared/domain/entities/region';

@Injectable()
export class RegionRepository {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
  ) {}

  async findById(id: string): Promise<Region | null> {
    return await this.regionRepository.findOne({ where: { id } });
  }

  async findByCode(code: string): Promise<Region | null> {
    return await this.regionRepository.findOne({ where: { code } });
  }

  async findDefaultRegion(): Promise<Region | null> {
    return await this.regionRepository.findOne({ where: { isDefault: true } });
  }
}
