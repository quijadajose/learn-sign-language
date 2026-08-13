import { Controller, Get, Head } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { CheckHealthService } from '../../services/check-health.service';
import { Public } from 'src/auth/infrastructure/decorators/public.decorator';
import {
  DocHealth,
  DocCheckApi,
  DocCheckDatabase,
  DocCheckValkey,
  DocCheckSsl,
  DocCheckDomain,
} from '../../docs/health.docs';

@Public()
@DocHealth()
@Controller('health')
export class HealthController {
  constructor(private checkHealthService: CheckHealthService) {}

  @Get('api')
  @HealthCheck()
  @DocCheckApi()
  checkApi() {
    return this.checkHealthService.checkApi();
  }

  @Head('api')
  @HealthCheck()
  checkApiHead() {
    return this.checkHealthService.checkApi();
  }

  @Get('database')
  @HealthCheck()
  @DocCheckDatabase()
  checkDatabase() {
    return this.checkHealthService.checkDatabase();
  }

  @Head('database')
  @HealthCheck()
  checkDatabaseHead() {
    return this.checkHealthService.checkDatabase();
  }

  @Get('valkey')
  @HealthCheck()
  @DocCheckValkey()
  checkValkey() {
    return this.checkHealthService.checkValkey();
  }

  @Head('valkey')
  @HealthCheck()
  checkValkeyHead() {
    return this.checkHealthService.checkValkey();
  }

  @Get('ssl')
  @HealthCheck()
  @DocCheckSsl()
  checkSsl() {
    return this.checkHealthService.checkSsl();
  }

  @Head('ssl')
  @HealthCheck()
  checkSslHead() {
    return this.checkHealthService.checkSsl();
  }

  @Get('domain')
  @HealthCheck()
  @DocCheckDomain()
  checkDomain() {
    return this.checkHealthService.checkDomain();
  }

  @Head('domain')
  @HealthCheck()
  checkDomainHead() {
    return this.checkHealthService.checkDomain();
  }
}
