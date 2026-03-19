import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

@Injectable()
export class ApiHealthIndicator {
  constructor(private healthIndicatorService: HealthIndicatorService) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();
    const version = process.env.npm_package_version || '0.0.1';

    return this.healthIndicatorService.check(key).up({
      uptime,
      timestamp,
      version,
    });
  }
}
