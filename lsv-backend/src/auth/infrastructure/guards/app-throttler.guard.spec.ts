import { describe, it, expect, afterEach } from '@jest/globals';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { AppThrottlerGuard } from './app-throttler.guard.js';

class TestableGuard extends AppThrottlerGuard {
  skip(context: ExecutionContext): Promise<boolean> {
    return this.shouldSkip(context);
  }
}

const contextOf = (type: string) =>
  ({ getType: () => type }) as unknown as ExecutionContext;

describe('AppThrottlerGuard', () => {
  const originalEnv = process.env.NODE_ENV;
  const guard = new TestableGuard(
    { throttlers: [{ ttl: 60000, limit: 10 }] },
    {} as ThrottlerStorage,
    new Reflector(),
  );

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('throttles HTTP requests outside tests', async () => {
    process.env.NODE_ENV = 'production';
    await expect(guard.skip(contextOf('http'))).resolves.toBe(false);
  });

  it('skips WebSocket messages, which have no HTTP response to set headers on', async () => {
    process.env.NODE_ENV = 'production';
    await expect(guard.skip(contextOf('ws'))).resolves.toBe(true);
  });

  it('skips everything under NODE_ENV=test', async () => {
    process.env.NODE_ENV = 'test';
    await expect(guard.skip(contextOf('http'))).resolves.toBe(true);
  });
});
