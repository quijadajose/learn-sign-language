import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './domain/entities/iso-3166-2/countries';
import { Division } from './domain/entities/iso-3166-2/divisions';
import { CountryDivisionRepository } from './infrastructure/repositories/country-division.repository';
import { CountryDivisionService } from './application/services/country-division.service';
import { CountryDivisionController } from './infrastructure/controllers/country-division.controller';

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
