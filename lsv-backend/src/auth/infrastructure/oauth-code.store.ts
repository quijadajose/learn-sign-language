import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type Redis from 'ioredis';

interface StoredExchange {
  accessToken: string;
  user: unknown;
}

const CODE_TTL_SECONDS = 60;
const KEY_PREFIX = 'oauth:code:';

/**
 * Short-lived one-time codes for OAuth callback → frontend exchange.
 * Stored in Valkey so codes survive restarts and work across API replicas.
 */
@Injectable()
export class OAuthCodeStore implements OnModuleDestroy {
  constructor(
    @Inject('OAUTH_CODE_REDIS')
    private readonly redis: Redis,
  ) {}

  async create(accessToken: string, user: unknown): Promise<string> {
    const payload: StoredExchange = { accessToken, user };
    // Retry on NX collision (extremely unlikely with 32 random bytes).
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomBytes(32).toString('hex');
      const ok = await this.redis.set(
        KEY_PREFIX + code,
        JSON.stringify(payload),
        'EX',
        CODE_TTL_SECONDS,
        'NX',
      );
      if (ok === 'OK') return code;
    }
    throw new Error('Failed to allocate unique OAuth exchange code');
  }

  /** Consumes the code (one-time use). Returns null if missing/expired. */
  async consume(
    code: string,
  ): Promise<{ accessToken: string; user: unknown } | null> {
    if (!code || typeof code !== 'string') return null;
    const raw = await this.redis.getdel(KEY_PREFIX + code);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as StoredExchange;
      if (!parsed?.accessToken) return null;
      return { accessToken: parsed.accessToken, user: parsed.user };
    } catch {
      return null;
    }
  }

  async onModuleDestroy() {
    await this.redis.quit().catch(() => undefined);
  }
}
