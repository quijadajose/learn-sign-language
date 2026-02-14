import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Region } from 'src/shared/domain/entities/region';
import { RegionService } from './application/services/region/region.service';
import { RegionController } from './infrastructure/controllers/region/region.controller';
import { RegionRepository } from './infrastructure/typeorm/region.repository/region.repository';
import { LanguageModule } from 'src/language/language.module';
import { CountryDivisionModule } from 'src/shared/country-division.module';
import { ModeratorModule } from 'src/moderator/moderator.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Region]),
    LanguageModule,
    CountryDivisionModule,
    forwardRef(() => ModeratorModule),
    forwardRef(() => AuthModule),
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
