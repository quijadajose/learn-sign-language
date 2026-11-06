import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './domain/entities/iso-3166-2/countries.js';
import { Division } from './domain/entities/iso-3166-2/divisions.js';
import { CountryDivisionRepository } from './infrastructure/repositories/country-division.repository.js';
import { CountryDivisionService } from './application/services/country-division.service.js';
import { CountryDivisionController } from './infrastructure/controllers/country-division.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Country, Division])],
  providers: [
    CountryDivisionRepository,
    {
      provide: 'CountryDivisionRepositoryInterface',
      useClass: CountryDivisionRepository,
    },
    CountryDivisionService,
  ],
  controllers: [CountryDivisionController],
  exports: [CountryDivisionService],
})
export class CountryDivisionModule {}
