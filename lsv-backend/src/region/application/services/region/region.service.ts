import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { withI18nParams } from 'src/i18n';
import { RegionRepositoryInterface } from 'src/region/domain/region.repository.interface';
import { CreateRegionDto } from 'src/region/domain/create-region.dto';
import { Region } from 'src/shared/domain/entities/region';
import {
  PaginationDto,
  PaginatedResponseDto,
} from 'src/shared/domain/dto/PaginationDto';
import { LanguageService } from 'src/language/application/services/language/language-admin.service';
import { CountryDivisionService } from 'src/shared/application/services/country-division.service';

@Injectable()
export class RegionService {
  constructor(
    @Inject('RegionRepositoryInterface')
    private readonly regionRepository: RegionRepositoryInterface,
    private readonly languageService: LanguageService,
    private readonly countryDivisionService: CountryDivisionService,
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
      throw new NotFoundException('errors.region.notFound');
    }
    return region;
  }

  async createRegion(createRegionDto: CreateRegionDto): Promise<Region> {
    const existingRegion = await this.regionRepository.findByCode(
      createRegionDto.code,
    );
    if (existingRegion) {
      throw new ConflictException('errors.region.alreadyExists');
    }

    const languageId = createRegionDto.languageId;
    if (!languageId) {
      throw new BadRequestException('errors.region.languageRequired');
    }

    if (createRegionDto.isDefault) {
      const existingDefault =
        await this.regionRepository.findDefaultByLanguageId(languageId);
      if (existingDefault) {
        throw new ConflictException(
          withI18nParams('errors.region.defaultExists', {
            name: existingDefault.name,
          }),
        );
      }
    }

    if (createRegionDto.divisionCode) {
      // Validate division code against ISO data
      try {
        await this.countryDivisionService.getDivisionByCode(
          createRegionDto.divisionCode,
        );
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new NotFoundException('errors.division.notFound');
        }
        throw error;
      }
    }

    const regionData = {
      ...createRegionDto,
      languageId,
    };

    const region = this.regionRepository.save(regionData as Region);
    return region;
  }

  async updateRegion(
    id: string,
    updateRegionDto: CreateRegionDto,
  ): Promise<Region> {
    const existingRegion = await this.regionRepository.findById(id);
    if (!existingRegion) {
      throw new NotFoundException('errors.region.notFound');
    }

    if (updateRegionDto.code !== existingRegion.code) {
      const regionWithSameCode = await this.regionRepository.findByCode(
        updateRegionDto.code,
      );
      if (regionWithSameCode && regionWithSameCode.id !== id) {
        throw new ConflictException('errors.region.alreadyExists');
      }
    }

    if (updateRegionDto.isDefault) {
      const languageId =
        updateRegionDto.languageId || existingRegion.languageId;
      const existingDefault =
        await this.regionRepository.findDefaultByLanguageId(languageId);

      if (existingDefault && existingDefault.id !== id) {
        throw new ConflictException(
          withI18nParams('errors.region.defaultExists', {
            name: existingDefault.name,
          }),
        );
      }
    }

    if (updateRegionDto.divisionCode) {
      try {
        await this.countryDivisionService.getDivisionByCode(
          updateRegionDto.divisionCode,
        );
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new NotFoundException('errors.division.notFound');
        }
        throw error;
      }
    }

    return await this.regionRepository.update(id, updateRegionDto);
  }

  async deleteRegion(id: string): Promise<void> {
    const region = await this.regionRepository.findById(id);
    if (!region) {
      throw new NotFoundException('errors.region.notFound');
    }
    if (region.isDefault) {
      throw new ConflictException('errors.region.cannotDeleteDefault');
    }

    await this.regionRepository.deleteById(id);
  }

  async assignLanguageToRegions(): Promise<{
    message: string;
    updated: number;
    i18nParams?: Record<string, string | number>;
  }> {
    const languages = await this.languageService.getAllLanguages({
      page: 1,
      limit: 1,
    });

    if (languages.data.length === 0) {
      throw new BadRequestException('errors.region.noLanguagesToAssign');
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
      ...withI18nParams('success.languageAssignedToRegions', {
        count: updatedCount,
      }),
      updated: updatedCount,
    };
  }
}
