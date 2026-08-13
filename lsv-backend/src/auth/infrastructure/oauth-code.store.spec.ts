import type Redis from 'ioredis';
import { OAuthCodeStore } from './oauth-code.store';

function createMemoryRedis(): Redis {
  const store = new Map<string, { value: string; expiresAt: number }>();

  const redis = {
    set: jest.fn(
      async (
        key: string,
        value: string,
        _ex: string,
        ttlSeconds: number,
        nx?: string,
      ) => {
        if (nx === 'NX' && store.has(key)) return null;
        store.set(key, {
          value,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
        return 'OK';
      },
    ),
    getdel: jest.fn(async (key: string) => {
      const entry = store.get(key);
      store.delete(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) return null;
      return entry.value;
    }),
    quit: jest.fn(async () => 'OK'),
  };

  return redis as unknown as Redis;
}

describe('OAuthCodeStore', () => {
  it('creates and consumes a one-time code', async () => {
    const store = new OAuthCodeStore(createMemoryRedis());
    const code = await store.create('jwt-token', { id: 'u1' });
    expect(code.length).toBeGreaterThanOrEqual(32);

    const first = await store.consume(code);
    expect(first).toEqual({ accessToken: 'jwt-token', user: { id: 'u1' } });

    const second = await store.consume(code);
    expect(second).toBeNull();
  });

  it('returns null for unknown codes', async () => {
    const store = new OAuthCodeStore(createMemoryRedis());
    expect(await store.consume('missing')).toBeNull();
  });
});
