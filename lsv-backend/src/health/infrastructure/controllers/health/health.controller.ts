import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { CheckHealthUseCase } from '../../../application/use-cases/check-health/check-health.use-case';
import { Public } from 'src/auth/infrastructure/decorators/public.decorator';
import { DocHealth, DocCheckHealth } from '../../docs/health.docs';

@Public()
@DocHealth()
@Controller('health')
export class HealthController {
  constructor(private checkHealthUseCase: CheckHealthUseCase) {}

  @Get()
  @HealthCheck()
  @DocCheckHealth()
  check() {
    return this.checkHealthUseCase.execute();
  }
}
