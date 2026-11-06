import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../../auth/infrastructure/decorators/roles.decorator.js';
import { RolesGuard } from '../../../../auth/infrastructure/guards/roles/roles.guard.js';
import { RequireResourcePermission } from '../../../../permissions/infrastructure/decorators/require-resource-permission.decorator.js';
import { PermissionScope } from '../../../../shared/domain/entities/moderatorPermission.js';
import { ResourceAccessGuard } from '../../../../permissions/infrastructure/guards/resource-access/resource-access.guard.js';
import { CreateRegionDto } from '../../../domain/create-region.dto.js';
import { GetRegionsQueryDto } from '../../../domain/dto/get-regions-query.dto.js';
import { RegionService } from '../../../application/services/region/region.service.js';
import { Region } from '../../../../shared/domain/entities/region.js';
import { LanguageService } from '../../../../language/application/services/language/language-admin.service.js';
import { CountryDivisionService } from '../../../../shared/application/services/country-division.service.js';
import { CountryWithDivisionsDto } from '../../../../shared/domain/dto/country-with-divisions.dto.js';
import { SearchCountriesDto } from '../../../../shared/domain/dto/search-countries.dto.js';
import { Country } from '../../../../shared/domain/entities/iso-3166-2/countries.js';
import {
  DocAssignLanguageToRegions,
  DocCreateRegion,
  DocDeleteRegion,
  DocGetCountries,
  DocGetCountriesWithDivisions,
  DocGetRegionById,
  DocListRegions,
  DocRegion,
  DocUpdateRegion,
} from './docs/region.docs.js';

@DocRegion()
@Controller('region')
export class RegionController {
  constructor(
    private readonly regionService: RegionService,
    private readonly languageService: LanguageService,
    private readonly countryDivisionService: CountryDivisionService,
  ) {}

  @Get()
  @DocListRegions()
  async getAllRegions(
    @Query() query: GetRegionsQueryDto,
  ): Promise<{ data: Region[]; total: number }> {
    return this.regionService.getAllRegions(query, query.languageId);
  }

  @Get('countries')
  @DocGetCountries()
  async getCountries(
    @Query() searchDto: SearchCountriesDto,
  ): Promise<Country[]> {
    return this.countryDivisionService.searchCountries(searchDto);
  }

  @Get('countries-with-divisions')
  @DocGetCountriesWithDivisions()
  async getCountriesWithDivisions(
    @Query() searchDto: SearchCountriesDto,
  ): Promise<CountryWithDivisionsDto[]> {
    return this.countryDivisionService.searchCountriesWithDivisions(searchDto);
  }

  @Get(':id')
  @DocGetRegionById()
  async getRegionById(@Param('id', ParseUUIDPipe) id: string): Promise<Region> {
    return this.regionService.getRegionById(id);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, { body: 'languageId' })
  @Post()
  @DocCreateRegion()
  async createRegion(
    @Body() createRegionDto: CreateRegionDto,
  ): Promise<Region> {
    return this.regionService.createRegion(createRegionDto);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.REGION, { param: 'id' })
  @Put(':id')
  @DocUpdateRegion()
  async updateRegion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRegionDto: CreateRegionDto,
  ): Promise<Region> {
    return this.regionService.updateRegion(id, updateRegionDto);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, {
    param: 'id',
    resolve: 'region.languageId',
  })
  @Delete(':id')
  @HttpCode(204)
  @DocDeleteRegion()
  async deleteRegion(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.regionService.deleteRegion(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('assign-language')
  @DocAssignLanguageToRegions()
  async assignLanguageToRegions(): Promise<{
    message: string;
    updated: number;
  }> {
    return this.regionService.assignLanguageToRegions();
  }
}
