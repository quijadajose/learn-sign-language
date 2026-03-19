import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import * as net from 'net';

@Injectable()
export class DomainHealthIndicator {
  constructor(private healthIndicatorService: HealthIndicatorService) {}

  async check(key: string, host: string): Promise<HealthIndicatorResult> {
    const session = this.healthIndicatorService.check(key);

    if (host === 'localhost' || host === '127.0.0.1') {
      return session.up({
        message: 'Domain check skipped for localhost',
      });
    }

    try {
      const expirationDate = await this.getDomainExpiration(host);
      const daysUntilExpiry = Math.ceil(
        (expirationDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24),
      );

      const isExpiringSoon = daysUntilExpiry < 30;

      return session.up({
        expiryDate: expirationDate.toISOString(),
        daysUntilExpiry,
        warning: isExpiringSoon ? 'Domain is expiring soon' : undefined,
      });
    } catch (error) {
      return session.up({
        message: 'Domain expiration check failed (WHOIS)',
        error: error.message,
      });
    }
  }

  private async getDomainExpiration(domain: string): Promise<Date> {
    const whoisServer = 'whois.verisign-grs.com';
    const response = await this.queryWhois(whoisServer, domain);

    const match = response.match(
      /(?:Registry Expiry Date|Expiration Date|Expires on):\s*([^\n\r]+)/i,
    );
    if (match && match[1]) {
      return new Date(match[1].trim());
    }

    throw new Error('Could not parse WHOIS response for expiration date');
  }

  private queryWhois(server: string, domain: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = '';
      const socket = net.createConnection(43, server, () => {
        socket.write(`${domain}\r\n`);
      });

      socket.setEncoding('utf8');
      socket.on('data', (chunk) => {
        data += chunk;
      });

      socket.on('end', () => {
        resolve(data);
      });

      socket.on('error', (err) => {
        reject(err);
      });

      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error('WHOIS query timeout'));
      });
    });
  }
}
