import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Request, Response } from 'express';

// En ESM los imports estáticos se evalúan antes que el mock: se mockea y luego se importa.
jest.unstable_mockModule('./cors.config.js', () => ({
  getCorsOrigins: jest.fn<any>(() => ['https://app.lsv.test']),
}));

const { getCorsOrigins } = await import('./cors.config.js');
const { requireTrustedOrigin } = await import('./trusted-origin.js');

function mockRes(): Response & { statusCode: number; body: unknown } {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe('requireTrustedOrigin', () => {
  beforeEach(() => {
    (getCorsOrigins as jest.Mock).mockReturnValue(['https://app.lsv.test']);
  });

  it('allows GET without Origin', () => {
    const next = jest.fn<any>();
    requireTrustedOrigin(
      { method: 'GET', headers: {} } as Request,
      mockRes(),
      next,
    );
    expect(next).toHaveBeenCalled();
  });

  it('allows Bearer mutations from any Origin', () => {
    const next = jest.fn<any>();
    requireTrustedOrigin(
      {
        method: 'POST',
        headers: { authorization: 'Bearer jwt', origin: 'https://evil.test' },
      } as Request,
      mockRes(),
      next,
    );
    expect(next).toHaveBeenCalled();
  });

  it('rejects cookie mutations from a foreign Origin', () => {
    const next = jest.fn<any>();
    const res = mockRes();
    requireTrustedOrigin(
      {
        method: 'POST',
        headers: {
          cookie: 'lsv_access=jwt-token',
          origin: 'https://evil.test',
        },
      } as Request,
      res,
      next,
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('rejects cookie mutations without Origin', () => {
    const next = jest.fn<any>();
    const res = mockRes();
    requireTrustedOrigin(
      {
        method: 'POST',
        headers: { cookie: 'lsv_access=jwt-token' },
      } as Request,
      res,
      next,
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('allows cookie mutations from the frontend Origin', () => {
    const next = jest.fn<any>();
    requireTrustedOrigin(
      {
        method: 'PUT',
        headers: {
          cookie: 'lsv_access=jwt-token',
          origin: 'https://app.lsv.test',
        },
      } as Request,
      mockRes(),
      next,
    );
    expect(next).toHaveBeenCalled();
  });
});
