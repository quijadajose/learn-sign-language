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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { RequireResourcePermission } from 'src/auth/infrastructure/decorators/require-resource-permission.decorator';
import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';
import { ResourceAccessGuard } from 'src/auth/infrastructure/guards/resource-access/resource-access.guard';
import { CreateRegionDto } from 'src/region/domain/create-region.dto';
import { GetRegionsQueryDto } from 'src/region/domain/dto/get-regions-query.dto';
import { RegionService } from 'src/region/application/services/region/region.service';
import { Region } from 'src/shared/domain/entities/region';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { LanguageService } from 'src/language/application/services/language/language-admin.service';
import { CountryDivisionService } from 'src/shared/application/services/country-division.service';
import { CountryWithDivisionsDto } from 'src/shared/domain/dto/country-with-divisions.dto';
import { SearchCountriesDto } from 'src/shared/domain/dto/search-countries.dto';
import { Country } from 'src/shared/domain/entities/iso-3166-2/countries';

@ApiTags('Regions')
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
  @ApiOperation({
    summary: 'Buscar países por nombre',
    description:
      'Busca países por nombre y retorna una lista con código y nombre del país. Útil para obtener el countryCode necesario para crear lenguajes.',
  })
  @ApiQuery({
    name: 'name',
    description: 'Nombre del país a buscar (mínimo 2 caracteres)',
    example: 'colom',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de países encontrados',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Código ISO del país',
            example: 'CO',
          },
          name: {
            type: 'string',
            description: 'Nombre del país',
            example: 'Colombia',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de búsqueda inválidos',
  })
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
