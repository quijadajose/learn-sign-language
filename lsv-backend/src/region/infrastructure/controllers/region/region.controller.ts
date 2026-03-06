import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { RequireResourcePermission } from 'src/auth/infrastructure/decorators/require-resource-permission.decorator';
import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';
import { ResourceAccessGuard } from 'src/auth/infrastructure/guards/resource-access/resource-access.guard';
import { CreateRegionDto } from 'src/region/domain/create-region.dto';
import { GetRegionsQueryDto } from 'src/region/domain/dto/get-regions-query.dto';
import { RegionService } from 'src/region/application/services/region/region.service';
import { Region } from 'src/shared/domain/entities/region';
import { LanguageService } from 'src/language/application/services/language/language-admin.service';
import { CountryDivisionService } from 'src/shared/application/services/country-division.service';
import { CountryWithDivisionsDto } from 'src/shared/domain/dto/country-with-divisions.dto';
import { SearchCountriesDto } from 'src/shared/domain/dto/search-countries.dto';
import { Country } from 'src/shared/domain/entities/iso-3166-2/countries';
import { DocGetCountries, DocRegion } from './docs/region.docs';

@DocRegion()
@Controller('region')
export class RegionController {
  constructor(
    private readonly regionService: RegionService,
    private readonly languageService: LanguageService,
    private readonly countryDivisionService: CountryDivisionService,
  ) {}

  @Get()
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
  async getCountriesWithDivisions(
    @Query() searchDto: SearchCountriesDto,
  ): Promise<CountryWithDivisionsDto[]> {
    return this.countryDivisionService.searchCountriesWithDivisions(searchDto);
  }

  @Get(':id')
  async getRegionById(@Param('id', ParseUUIDPipe) id: string): Promise<Region> {
    return this.regionService.getRegionById(id);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, { body: 'languageId' })
  @Post()
  async createRegion(
    @Body() createRegionDto: CreateRegionDto,
  ): Promise<Region> {
    return this.regionService.createRegion(createRegionDto);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.REGION, { param: 'id' })
  @Put(':id')
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
  async deleteRegion(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.regionService.deleteRegion(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('assign-language')
  async assignLanguageToRegions(): Promise<{
    message: string;
    updated: number;
  }> {
    return this.regionService.assignLanguageToRegions();
  }
}
