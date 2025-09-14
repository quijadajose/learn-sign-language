import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CountryDivisionRepositoryInterface } from '../../domain/ports/country-division.repository.interface';
import { CreateCountryDto } from '../../domain/dto/create-country.dto';
import { CreateDivisionDto } from '../../domain/dto/create-division.dto';
import { SearchDivisionsDto } from '../../domain/dto/search-divisions.dto';
import { PaginatedResponseDto } from '../../domain/dto/paginated-response.dto';
import { Country } from '../../domain/entities/iso-3166-2/countries';
import { Division } from '../../domain/entities/iso-3166-2/divisions';
import { CountryWithDivisionsDto } from '../../domain/dto/country-with-divisions.dto';

@Injectable()
export class CountryDivisionService {
  constructor(
    @Inject('CountryDivisionRepositoryInterface')
    private readonly countryDivisionRepository: CountryDivisionRepositoryInterface,
  ) {}

  async createCountry(createCountryDto: CreateCountryDto): Promise<Country> {
    const existingCountry =
      await this.countryDivisionRepository.findCountryByCode(
        createCountryDto.code,
      );
    if (existingCountry) {
      throw new ConflictException(
        `Country with code ${createCountryDto.code} already exists`,
      );
    }

    return await this.countryDivisionRepository.createCountry(createCountryDto);
  }

  async getCountryByCode(code: string): Promise<Country> {
    const country =
      await this.countryDivisionRepository.findCountryByCode(code);
    if (!country) {
      throw new NotFoundException(`Country with code ${code} not found`);
    }
    return country;
  }

  async getAllCountries(): Promise<Country[]> {
    return await this.countryDivisionRepository.findAllCountries();
  }

  async searchCountries(search: string): Promise<Country[]> {
    if (!search || search.trim().length < 2) {
      return [];
    }
    return await this.countryDivisionRepository.searchCountries(search.trim());
  }

  async createDivision(
    createDivisionDto: CreateDivisionDto,
  ): Promise<Division> {
    const existingDivision =
      await this.countryDivisionRepository.findDivisionByCode(
        createDivisionDto.code,
      );
    if (existingDivision) {
      throw new ConflictException(
        `Division with code ${createDivisionDto.code} already exists`,
      );
    }
    const country = await this.countryDivisionRepository.findCountryByCode(
      createDivisionDto.countryCode,
    );
    if (!country) {
      throw new NotFoundException(
        `Country with code ${createDivisionDto.countryCode} not found`,
      );
    }

    return await this.countryDivisionRepository.createDivision(
      createDivisionDto,
    );
  }

  async getDivisionByCode(code: string): Promise<Division> {
    const division =
      await this.countryDivisionRepository.findDivisionByCode(code);
    if (!division) {
      throw new NotFoundException(`Division with code ${code} not found`);
    }
    return division;
  }

  async getDivisionsByCountryCode(countryCode: string): Promise<Division[]> {
    const country =
      await this.countryDivisionRepository.findCountryByCode(countryCode);
    if (!country) {
      throw new NotFoundException(`Country with code ${countryCode} not found`);
    }

    return await this.countryDivisionRepository.findDivisionsByCountryCode(
      countryCode,
    );
  }

  async getAllDivisions(): Promise<Division[]> {
    return await this.countryDivisionRepository.findAllDivisions();
  }

  async searchDivisions(
    searchDto: SearchDivisionsDto,
  ): Promise<PaginatedResponseDto<Division>> {
    if (searchDto.countryCode) {
      const country = await this.countryDivisionRepository.findCountryByCode(
        searchDto.countryCode,
      );
      if (!country) {
        throw new NotFoundException(
          `Country with code ${searchDto.countryCode} not found`,
        );
      }
    }

    return await this.countryDivisionRepository.searchDivisions(searchDto);
  }

  async getCountriesWithDivisions(): Promise<CountryWithDivisionsDto[]> {
    const countries = await this.countryDivisionRepository.findAllCountries();

    const countriesWithDivisions: CountryWithDivisionsDto[] = [];

    for (const country of countries) {
      const divisions =
        await this.countryDivisionRepository.findDivisionsByCountryCode(
          country.code,
        );

      countriesWithDivisions.push({
        code: country.code,
        name: country.name,
        divisions: divisions.map((division) => ({
          code: division.code,
          name: division.name,
        })),
      });
    }

    return countriesWithDivisions;
  }
}
