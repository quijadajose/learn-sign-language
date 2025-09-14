import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CountryDivisionService } from '../../application/services/country-division.service';
import { SearchDivisionsDto } from '../../domain/dto/search-divisions.dto';
import { PaginatedResponseDto } from '../../domain/dto/paginated-response.dto';
import { Division } from '../../domain/entities/iso-3166-2/divisions';
import { Country } from '../../domain/entities/iso-3166-2/countries';

@Controller('country-division')
export class CountryDivisionController {
  constructor(
    private readonly countryDivisionService: CountryDivisionService,
  ) {}

  @Get('countries')
  async getAllCountries(): Promise<Country[]> {
    return await this.countryDivisionService.getAllCountries();
  }

  @Get('divisions/search')
  async searchDivisions(
    @Query() searchDto: SearchDivisionsDto,
  ): Promise<PaginatedResponseDto<Division>> {
    return await this.countryDivisionService.searchDivisions(searchDto);
  }

  @Get('divisions')
  async getAllDivisions(): Promise<Division[]> {
    return await this.countryDivisionService.getAllDivisions();
  }

  @Get('countries/:countryCode/divisions')
  async getDivisionsByCountry(
    @Query('countryCode') countryCode: string,
  ): Promise<Division[]> {
    return await this.countryDivisionService.getDivisionsByCountryCode(
      countryCode,
    );
  }
}
