import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Region } from '../shared/domain/entities/region.js';
import { RegionService } from './application/services/region/region.service.js';
import { RegionController } from './infrastructure/controllers/region/region.controller.js';
import { RegionRepository } from './infrastructure/typeorm/region.repository/region.repository.js';
import { LanguageModule } from '../language/language.module.js';
import { CountryDivisionModule } from '../shared/country-division.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Region]),
    LanguageModule,
    CountryDivisionModule,
  ],
  providers: [
    RegionService,
    {
      provide: 'RegionRepositoryInterface',
      useClass: RegionRepository,
    },
  ],
  controllers: [RegionController],
  exports: [
    RegionService,
    {
      provide: 'RegionRepositoryInterface',
      useClass: RegionRepository,
    },
    TypeOrmModule,
  ],
})
export class RegionModule {}
