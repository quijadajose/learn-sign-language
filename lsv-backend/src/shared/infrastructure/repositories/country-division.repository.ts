import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Country } from '../../domain/entities/iso-3166-2/countries';
import { Division } from '../../domain/entities/iso-3166-2/divisions';
import { CountryDivisionRepositoryInterface } from '../../domain/ports/country-division.repository.interface';
import { SearchDivisionsDto } from '../../domain/dto/search-divisions.dto';
import { PaginatedResponseDto } from '../../domain/dto/paginated-response.dto';
import { CountryWithDivisionsDto } from '../../domain/dto/country-with-divisions.dto';

@Injectable()
export class CountryDivisionRepository
  implements CountryDivisionRepositoryInterface
{
  constructor(
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
    @InjectRepository(Division)
    private readonly divisionRepository: Repository<Division>,
  ) {}

  async createCountry(countryData: {
    code: string;
    name: string;
  }): Promise<Country> {
    const country = this.countryRepository.create(countryData);
    return await this.countryRepository.save(country);
  }

  async createCountries(
    countriesData: { code: string; name: string }[],
  ): Promise<Country[]> {
    if (!countriesData || countriesData.length === 0) return [];
    const codes = countriesData.map((c) => c.code);
    const existing = await this.countryRepository.findBy({
      code: In(codes as any),
    } as any);
    const existingCodes = new Set(existing.map((e) => e.code));
    const toCreate = countriesData.filter((c) => !existingCodes.has(c.code));
    if (toCreate.length === 0) return existing;
    const entities = this.countryRepository.create(toCreate);
    return await this.countryRepository.save(entities);
  }

  async findCountryByCode(code: string): Promise<Country | null> {
    return await this.countryRepository.findOne({ where: { code } });
  }

  async findAllCountries(): Promise<Country[]> {
    return await this.countryRepository.find({
      relations: ['divisions'],
      order: { name: 'ASC' },
    });
  }

  async searchCountries(search: string): Promise<Country[]> {
    return await this.countryRepository.find({
      where: {
        name: Like(`%${search}%`),
      },
      order: { name: 'ASC' },
      take: 20,
    });
  }

  async searchCountriesWithDivisions(
    search: string,
  ): Promise<CountryWithDivisionsDto[]> {
    const countries = await this.countryRepository.find({
      where: {
        name: Like(`%${search}%`),
      },
      relations: ['divisions'],
      order: { name: 'ASC' },
      take: 20,
    });

    return countries.map((country) => ({
      code: country.code,
      name: country.name,
      divisions: country.divisions.map((division) => ({
        code: division.code,
        name: division.name,
      })),
    }));
  }

  async createDivision(divisionData: {
    code: string;
    name: string;
    countryCode: string;
  }): Promise<Division> {
    const country = await this.findCountryByCode(divisionData.countryCode);
    if (!country) {
      throw new Error(
        `Country with code ${divisionData.countryCode} not found`,
      );
    }

    const division = this.divisionRepository.create({
      ...divisionData,
      country,
    });
    return await this.divisionRepository.save(division);
  }

  async createDivisions(
    divisionsData: {
      code: string;
      name: string;
      countryCode: string;
    }[],
  ): Promise<Division[]> {
    if (!divisionsData || divisionsData.length === 0) return [];
    const codes = divisionsData.map((d) => d.code);
    const existing = await this.divisionRepository.findBy({
      code: In(codes as any),
    } as any);
    const existingCodes = new Set(existing.map((e) => e.code));

    // Load countries for mapping
    const countryCodes = Array.from(
      new Set(divisionsData.map((d) => d.countryCode)),
    );
    const countries = await this.countryRepository.findBy({
      code: In(countryCodes as any),
    } as any);
    const countryMap = new Map(countries.map((c) => [c.code, c]));

    const toCreate = divisionsData.filter(
      (d) => !existingCodes.has(d.code) && countryMap.has(d.countryCode),
    );
    const entities = toCreate.map((d) =>
      this.divisionRepository.create({
        ...d,
        country: countryMap.get(d.countryCode),
      }),
    );
    if (entities.length === 0) return existing;
    return await this.divisionRepository.save(entities);
  }

  async findDivisionByCode(code: string): Promise<Division | null> {
    return await this.divisionRepository.findOne({
      where: { code },
      relations: ['country'],
    });
  }

  async findDivisionsByCountryCode(countryCode: string): Promise<Division[]> {
    return await this.divisionRepository.find({
      where: { country: { code: countryCode } },
      relations: ['country'],
      order: { name: 'ASC' },
    });
  }

  async findAllDivisions(): Promise<Division[]> {
    return await this.divisionRepository.find({
      relations: ['country'],
      order: { name: 'ASC' },
    });
  }

  async searchDivisions(
    searchDto: SearchDivisionsDto,
  ): Promise<PaginatedResponseDto<Division>> {
    const { countryCode, search, page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.divisionRepository
      .createQueryBuilder('division')
      .leftJoinAndSelect('division.country', 'country');

    if (countryCode) {
      queryBuilder.andWhere('country.code = :countryCode', { countryCode });
    }

    if (search) {
      queryBuilder.andWhere(
        'division.name LIKE :search COLLATE utf8mb4_general_ci',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('division.name', 'ASC').skip(skip).take(limit);

    const [divisions, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(divisions, total, page, limit);
  }
}
