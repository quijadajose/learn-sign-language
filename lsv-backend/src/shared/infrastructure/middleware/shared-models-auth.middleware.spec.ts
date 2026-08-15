import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { createSharedModelsAuthMiddleware } from './shared-models-auth.middleware';

function mockReq(
  overrides: Partial<Request> & {
    path?: string;
    method?: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
  } = {},
): Request {
  return {
    path: '/models/m1/model.json',
    method: 'GET',
    headers: {},
    query: {},
    ...overrides,
  } as unknown as Request;
}

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

describe('createSharedModelsAuthMiddleware', () => {
  const configService = {
    get: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;
  const jwtService = {
    verify: jest.fn(),
  } as unknown as JwtService;

  const middleware = createSharedModelsAuthMiddleware(
    configService,
    jwtService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'u1' });
  });

  it('skips non-model paths', () => {
    const next = jest.fn();
    middleware(mockReq({ path: '/training_data/x' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(jwtService.verify).not.toHaveBeenCalled();
  });

  it('accepts a valid Bearer token', () => {
    const next = jest.fn();
    middleware(
      mockReq({ headers: { authorization: 'Bearer jwt-token' } }),
      mockRes(),
      next,
    );
    expect(jwtService.verify).toHaveBeenCalledWith('jwt-token', {
      secret: 'test-secret',
    });
    expect(next).toHaveBeenCalled();
  });

  it('accepts a valid access cookie', () => {
    const next = jest.fn();
    middleware(
      mockReq({ headers: { cookie: 'lsv_access=jwt-token' } }),
      mockRes(),
      next,
    );
    expect(jwtService.verify).toHaveBeenCalledWith('jwt-token', {
      secret: 'test-secret',
    });
    expect(next).toHaveBeenCalled();
  });

  it('rejects a reset-purpose JWT', () => {
    const next = jest.fn();
    const res = mockRes();
    (jwtService.verify as jest.Mock).mockReturnValue({ purpose: 'reset' });
    middleware(
      mockReq({ headers: { authorization: 'Bearer jwt-token' } }),
      res,
      next,
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('rejects ?access_token= even if the JWT is valid', () => {
    const next = jest.fn();
    const res = mockRes();
    middleware(mockReq({ query: { access_token: 'jwt-token' } }), res, next);
    expect(jwtService.verify).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('rejects missing Authorization', () => {
    const next = jest.fn();
    const res = mockRes();
    middleware(mockReq(), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});
