import { Country } from '../entities/iso-3166-2/countries';
import { Division } from '../entities/iso-3166-2/divisions';
import { SearchDivisionsDto } from '../dto/search-divisions.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

export interface CountryDivisionRepositoryInterface {
  createCountry(countryData: { code: string; name: string }): Promise<Country>;
  findCountryByCode(code: string): Promise<Country | null>;
  findAllCountries(): Promise<Country[]>;
  searchCountries(search: string): Promise<Country[]>;

  createDivision(divisionData: {
    code: string;
    name: string;
    countryCode: string;
  }): Promise<Division>;
  findDivisionByCode(code: string): Promise<Division | null>;
  findDivisionsByCountryCode(countryCode: string): Promise<Division[]>;
  findAllDivisions(): Promise<Division[]>;
  searchDivisions(
    searchDto: SearchDivisionsDto,
  ): Promise<PaginatedResponseDto<Division>>;
}
