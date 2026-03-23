import { Controller, Get, Head } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { CheckHealthUseCase } from '../../../application/use-cases/check-health/check-health.use-case';
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
  constructor(private checkHealthUseCase: CheckHealthUseCase) {}

  @Head('api')
  @Get('api')
  @HealthCheck()
  @DocCheckApi()
  checkApi() {
    return this.checkHealthUseCase.checkApi();
  }

  @Head('database')
  @Get('database')
  @HealthCheck()
  @DocCheckDatabase()
  checkDatabase() {
    return this.checkHealthUseCase.checkDatabase();
  }

  @Head('valkey')
  @Get('valkey')
  @HealthCheck()
  @DocCheckValkey()
  checkValkey() {
    return this.checkHealthUseCase.checkValkey();
  }

  @Head('ssl')
  @Get('ssl')
  @HealthCheck()
  @DocCheckSsl()
  checkSsl() {
    return this.checkHealthUseCase.checkSsl();
  }

  @Head('domain')
  @Get('domain')
  @HealthCheck()
  @DocCheckDomain()
  checkDomain() {
    return this.checkHealthUseCase.checkDomain();
  }
}
