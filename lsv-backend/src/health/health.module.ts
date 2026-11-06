import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './infrastructure/controllers/health/health.controller.js';
import {
  SslHealthIndicator,
  DomainHealthIndicator,
  ApiHealthIndicator,
} from './infrastructure/indicators/index.js';
import { CheckHealthService } from './infrastructure/services/check-health.service.js';

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
