import { getCorsOrigins } from './cors.config';

jest.mock('./cors.config', () => ({
  getCorsOrigins: jest.fn(() => ['https://app.lsv.test']),
}));

import { requireTrustedOrigin } from './trusted-origin';
import { Request, Response } from 'express';

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
    const next = jest.fn();
    requireTrustedOrigin(
      { method: 'GET', headers: {} } as Request,
      mockRes(),
      next,
    );
    expect(next).toHaveBeenCalled();
  });

  it('allows Bearer mutations from any Origin', () => {
    const next = jest.fn();
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
    const next = jest.fn();
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
    const next = jest.fn();
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
    const next = jest.fn();
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
