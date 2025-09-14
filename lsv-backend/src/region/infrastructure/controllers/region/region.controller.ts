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
  Inject,
} from '@nestjs/common';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { CreateRegionDto } from 'src/region/domain/create-region.dto';
import { GetRegionsQueryDto } from 'src/region/domain/dto/get-regions-query.dto';
import { RegionService } from 'src/region/application/services/region/region.service';
import { Region } from 'src/shared/domain/entities/region';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { LanguageService } from 'src/language/application/services/language/language-admin.service';
import { CountryDivisionService } from 'src/shared/application/services/country-division.service';
import { CountryWithDivisionsDto } from 'src/shared/domain/dto/country-with-divisions.dto';
import { Country } from 'src/shared/domain/entities/iso-3166-2/countries';

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

  @Get(':id')
  async getRegionById(@Param('id', ParseUUIDPipe) id: string): Promise<Region> {
    return this.regionService.getRegionById(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  async createRegion(
    @Body() createRegionDto: CreateRegionDto,
  ): Promise<Region> {
    return this.regionService.createRegion(createRegionDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put(':id')
  async updateRegion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRegionDto: CreateRegionDto,
  ): Promise<Region> {
    return this.regionService.updateRegion(id, updateRegionDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
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

  @Get('countries-with-divisions')
  async getCountriesWithDivisions(): Promise<CountryWithDivisionsDto[]> {
    return this.countryDivisionService.getCountriesWithDivisions();
  }

  @Get('countries/search')
  async searchCountries(@Query('q') query: string): Promise<Country[]> {
    return this.countryDivisionService.searchCountries(query);
  }
}
