import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import * as tls from 'tls';

@Injectable()
export class SslHealthIndicator {
  constructor(private healthIndicatorService: HealthIndicatorService) {}

  async check(key: string, host: string): Promise<HealthIndicatorResult> {
    const session = this.healthIndicatorService.check(key);

    if (host === 'localhost' || host === '127.0.0.1') {
      return session.up({
        message: 'SSL check skipped for localhost',
      });
    }

    try {
      const { expiryDate, errors } = await this.getCertificateInfo(host);

      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24),
      );

      const isExpiringSoon = daysUntilExpiry < 15;
      const isHealthy = errors.length === 0 && !isExpiringSoon;

      const data = {
        expiryDate: expiryDate.toISOString(),
        daysUntilExpiry,
        errors,
        warning: isExpiringSoon ? 'Certificate is expiring soon' : undefined,
      };

      return isHealthy ? session.up(data) : session.down(data);
    } catch (error) {
      return session.down({
        message: error.message,
      });
    }
  }

  private getCertificateInfo(
    host: string,
    port: number = 443,
  ): Promise<{ expiryDate: Date; errors: string[] }> {
    return new Promise((resolve, reject) => {
      const errors: string[] = [];
      const socket = tls.connect(
        {
          host,
          port,
          servername: host,
          rejectUnauthorized: false,
        },
        () => {
          const cert = socket.getPeerCertificate();
          const authorized = socket.authorized;
          const authorizationError = socket.authorizationError;

          if (!authorized && authorizationError) {
            errors.push(
              authorizationError.message || String(authorizationError),
            );
          }

          socket.end();

          if (cert && cert.valid_to) {
            resolve({
              expiryDate: new Date(cert.valid_to),
              errors,
            });
          } else {
            reject(new Error('No certificate found'));
          }
        },
      );

      socket.on('error', (err) => {
        reject(err);
      });

      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error('SSL check timeout'));
      });
    });
  }
}
