import { Controller, Get, Head, UseGuards } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { CheckHealthService } from '../../services/check-health.service.js';
import { Public } from '../../../../auth/infrastructure/decorators/public.decorator.js';
import { Roles } from '../../../../auth/infrastructure/decorators/roles.decorator.js';
import { RolesGuard } from '../../../../auth/infrastructure/guards/roles/roles.guard.js';
import {
  DocHealth,
  DocCheckApi,
  DocCheckDatabase,
  DocCheckValkey,
  DocCheckSsl,
  DocCheckDomain,
} from '../../docs/health.docs.js';

@DocHealth()
@Controller('health')
export class HealthController {
  constructor(private checkHealthService: CheckHealthService) {}

  @Public()
  @Get('api')
  @HealthCheck()
  @DocCheckApi()
  checkApi() {
    return this.checkHealthService.checkApi();
  }

  @Public()
  @Head('api')
  @HealthCheck()
  checkApiHead() {
    return this.checkHealthService.checkApi();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('database')
  @HealthCheck()
  @DocCheckDatabase()
  checkDatabase() {
    return this.checkHealthService.checkDatabase();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Head('database')
  @HealthCheck()
  checkDatabaseHead() {
    return this.checkHealthService.checkDatabase();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('valkey')
  @HealthCheck()
  @DocCheckValkey()
  checkValkey() {
    return this.checkHealthService.checkValkey();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Head('valkey')
  @HealthCheck()
  checkValkeyHead() {
    return this.checkHealthService.checkValkey();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('ssl')
  @HealthCheck()
  @DocCheckSsl()
  checkSsl() {
    return this.checkHealthService.checkSsl();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Head('ssl')
  @HealthCheck()
  checkSslHead() {
    return this.checkHealthService.checkSsl();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('domain')
  @HealthCheck()
  @DocCheckDomain()
  checkDomain() {
    return this.checkHealthService.checkDomain();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Head('domain')
  @HealthCheck()
  checkDomainHead() {
    return this.checkHealthService.checkDomain();
  }
}
