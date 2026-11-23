import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { createSharedModelsAuthMiddleware } from './shared-models-auth.middleware.js';

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

function mockRes() {
  const res = {
    statusCode: 200,
    status: jest.fn(function (this: typeof res, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response & { statusCode: number };
}

describe('createSharedModelsAuthMiddleware', () => {
  const configService = {
    get: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;
  const jwtService = {
    verify: jest.fn(),
  } as unknown as JwtService;
  const loadAuthState = jest.fn();

  const middleware = createSharedModelsAuthMiddleware(
    configService,
    jwtService,
    loadAuthState,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (jwtService.verify as jest.Mock).mockReturnValue({
      sub: 'u1',
      tokenVersion: 3,
    });
    loadAuthState.mockResolvedValue({ tokenVersion: 3 });
  });

  it('skips non-model paths', async () => {
    const next = jest.fn();
    await middleware(mockReq({ path: '/training_data/x' }), mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(jwtService.verify).not.toHaveBeenCalled();
  });

  it('accepts a valid Bearer token whose tokenVersion matches the user', async () => {
    const next = jest.fn();
    await middleware(
      mockReq({ headers: { authorization: 'Bearer jwt-token' } }),
      mockRes(),
      next,
    );
    expect(jwtService.verify).toHaveBeenCalledWith('jwt-token', {
      secret: 'test-secret',
    });
    expect(loadAuthState).toHaveBeenCalledWith('u1');
    expect(next).toHaveBeenCalled();
  });

  it('accepts a valid access cookie', async () => {
    const next = jest.fn();
    await middleware(
      mockReq({ headers: { cookie: 'lsv_access=jwt-token' } }),
      mockRes(),
      next,
    );
    expect(jwtService.verify).toHaveBeenCalledWith('jwt-token', {
      secret: 'test-secret',
    });
    expect(next).toHaveBeenCalled();
  });

  it('rejects a token revoked by logout (stale tokenVersion)', async () => {
    const next = jest.fn();
    const res = mockRes();
    loadAuthState.mockResolvedValue({ tokenVersion: 4 });
    await middleware(
      mockReq({ headers: { authorization: 'Bearer jwt-token' } }),
      res,
      next,
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('rejects a token whose user no longer exists', async () => {
    const next = jest.fn();
    const res = mockRes();
    loadAuthState.mockResolvedValue(null);
    await middleware(
      mockReq({ headers: { authorization: 'Bearer jwt-token' } }),
      res,
      next,
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('rejects a reset-purpose JWT', async () => {
    const next = jest.fn();
    const res = mockRes();
    (jwtService.verify as jest.Mock).mockReturnValue({ purpose: 'reset' });
    await middleware(
      mockReq({ headers: { authorization: 'Bearer jwt-token' } }),
      res,
      next,
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});
