import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { RegionRepositoryInterface } from 'src/region/domain/region.repository.interface';
import { CreateRegionDto } from 'src/region/domain/create-region.dto';
import { Region } from 'src/shared/domain/entities/region';
import {
  PaginationDto,
  PaginatedResponseDto,
} from 'src/shared/domain/dto/PaginationDto';
import { LanguageService } from 'src/language/application/services/language/language-admin.service';

@Injectable()
export class RegionService {
  constructor(
    @Inject('RegionRepositoryInterface')
    private readonly regionRepository: RegionRepositoryInterface,
    private readonly languageService: LanguageService,
  ) {}

  async getAllRegions(
    pagination: PaginationDto,
    languageId?: string,
  ): Promise<PaginatedResponseDto<Region>> {
    if (languageId) {
      return await this.regionRepository.findByLanguageId(
        languageId,
        pagination,
      );
    }
    return await this.regionRepository.findAll(pagination);
  }

  async getRegionById(id: string): Promise<Region> {
    const region = await this.regionRepository.findById(id);
    if (!region) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }
    return region;
  }

  async createRegion(createRegionDto: CreateRegionDto): Promise<Region> {
    const existingRegion = await this.regionRepository.findByCode(
      createRegionDto.code,
    );
    if (existingRegion) {
      throw new ConflictException(
        `Region with code ${createRegionDto.code} already exists`,
      );
    }

    let languageId = createRegionDto.languageId;
    if (!languageId) {
      throw new Error('languageId is required to create a region');
    }

    const regionData = {
      ...createRegionDto,
      languageId,
    };

    const region = this.regionRepository.save(regionData as any);
    return region;
  }

  async updateRegion(
    id: string,
    updateRegionDto: CreateRegionDto,
  ): Promise<Region> {
    const existingRegion = await this.regionRepository.findById(id);
    if (!existingRegion) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }

    if (updateRegionDto.code !== existingRegion.code) {
      const regionWithSameCode = await this.regionRepository.findByCode(
        updateRegionDto.code,
      );
      if (regionWithSameCode && regionWithSameCode.id !== id) {
        throw new ConflictException(
          `Region with code ${updateRegionDto.code} already exists`,
        );
      }
    }

    return await this.regionRepository.update(id, updateRegionDto);
  }

  async deleteRegion(id: string): Promise<void> {
    const region = await this.regionRepository.findById(id);
    if (!region) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }
    if (region.isDefault) {
      throw new ConflictException('Cannot delete the default region');
    }

    await this.regionRepository.deleteById(id);
  }

  async assignLanguageToRegions(): Promise<{
    message: string;
    updated: number;
  }> {
    const languages = await this.languageService.getAllLanguages({
      page: 1,
      limit: 1,
    });

    if (languages.data.length === 0) {
      throw new Error('No languages available to assign to regions');
    }

    const languageId = languages.data[0].id;

    const allRegions = await this.regionRepository.findAll({
      page: 1,
      limit: 1000,
    });
    const regionsWithoutLanguage = allRegions.data.filter(
      (region) => !region.languageId,
    );

    let updatedCount = 0;

    for (const region of regionsWithoutLanguage) {
      await this.regionRepository.update(region.id, {
        ...region,
        languageId: languageId,
      });
      updatedCount++;
    }

    return {
      message: `Successfully assigned language ${languageId} to ${updatedCount} regions`,
      updated: updatedCount,
    };
  }
}
