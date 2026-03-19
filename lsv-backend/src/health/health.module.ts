import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './infrastructure/controllers/health/health.controller';
import {
  SslHealthIndicator,
  DomainHealthIndicator,
  ApiHealthIndicator,
} from './infrastructure/indicators';
import { CheckHealthUseCase } from './application/use-cases/check-health/check-health.use-case';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    SslHealthIndicator,
    DomainHealthIndicator,
    ApiHealthIndicator,
    CheckHealthUseCase,
  ],
})
export class HealthModule {}
