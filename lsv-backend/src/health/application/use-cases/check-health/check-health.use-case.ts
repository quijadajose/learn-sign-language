import { Injectable } from '@nestjs/common';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import {
  SslHealthIndicator,
  DomainHealthIndicator,
  ApiHealthIndicator,
} from '../../../infrastructure/indicators';

@Injectable()
export class CheckHealthUseCase {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private configService: ConfigService,
    private ssl: SslHealthIndicator,
    private domain: DomainHealthIndicator,
    private api: ApiHealthIndicator,
  ) {}

  async checkApi() {
    return this.health.check([() => this.api.isHealthy('api')]);
  }

  async checkDatabase() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  async checkValkey() {
    return this.health.check([
      () =>
        this.microservice.pingCheck('valkey', {
          transport: Transport.REDIS,
          options: {
            host: this.configService.get<string>('VALKEY_HOST'),
            port: this.configService.get<number>('VALKEY_PORT'),
          },
        }),
    ]);
  }

  async checkSsl() {
    return this.health.check([() => this.getSslIndicator()]);
  }

  async checkDomain() {
    return this.health.check([() => this.getDomainIndicator()]);
  }

  private getSslIndicator() {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const domain = new URL(frontendUrl).hostname;
    return this.ssl.check('ssl', domain);
  }

  private getDomainIndicator() {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const domain = new URL(frontendUrl).hostname;
    return this.domain.check('domain', domain);
  }
}
