import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './infrastructure/controllers/health/health.controller';
import {
  SslHealthIndicator,
  DomainHealthIndicator,
  ApiHealthIndicator,
} from './infrastructure/indicators';
import { CheckHealthService } from './infrastructure/services/check-health.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    SslHealthIndicator,
    DomainHealthIndicator,
    ApiHealthIndicator,
    CheckHealthService,
  ],
})
export class HealthModule {}
