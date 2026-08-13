import { Controller, Get, Param, Query } from '@nestjs/common';
import { CountryDivisionService } from '../../application/services/country-division.service';
import { SearchDivisionsDto } from '../../domain/dto/search-divisions.dto';
import { PaginatedResponseDto } from '../../domain/dto/paginated-response.dto';
import { Division } from '../../domain/entities/iso-3166-2/divisions';
import { Country } from '../../domain/entities/iso-3166-2/countries';
import {
  DocCountryDivision,
  DocGetAllCountries,
  DocGetAllDivisions,
  DocGetDivisionsByCountry,
  DocSearchDivisions,
} from './docs/country-division.docs';

@DocCountryDivision()
@Controller('country-division')
export class CountryDivisionController {
  constructor(
    private readonly countryDivisionService: CountryDivisionService,
  ) {}

  @Get('countries')
  @DocGetAllCountries()
  async getAllCountries(): Promise<Country[]> {
    return await this.countryDivisionService.getAllCountries();
  }

  @Get('divisions/search')
  @DocSearchDivisions()
  async searchDivisions(
    @Query() searchDto: SearchDivisionsDto,
  ): Promise<PaginatedResponseDto<Division>> {
    return await this.countryDivisionService.searchDivisions(searchDto);
  }

  @Get('divisions')
  @DocGetAllDivisions()
  async getAllDivisions(): Promise<Division[]> {
    return await this.countryDivisionService.getAllDivisions();
  }

  @Get('countries/:countryCode/divisions')
  @DocGetDivisionsByCountry()
  async getDivisionsByCountry(
    @Param('countryCode') countryCode: string,
  ): Promise<Division[]> {
    return await this.countryDivisionService.getDivisionsByCountryCode(
      countryCode,
    );
  }
}
