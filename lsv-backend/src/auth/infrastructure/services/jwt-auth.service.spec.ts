import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthService } from './jwt-auth.service';
import { User } from 'src/shared/domain/entities/user';

describe('JwtAuthService', () => {
  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
    verify: jest.fn(),
  };
  const configService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };
  const service = new JwtAuthService(
    configService as unknown as ConfigService,
    jwtService as unknown as JwtService,
  );

  const user = {
    id: 'u1',
    email: 'a@test.com',
    role: 'user',
    tokenVersion: 3,
  } as User;

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockReturnValue('test-secret');
    jwtService.sign.mockReturnValue('signed-token');
  });

  it('signs access tokens with tokenVersion by default', () => {
    expect(service.generateToken(user)).toBe('signed-token');
    expect(jwtService.sign).toHaveBeenCalledWith(
      {
        email: 'a@test.com',
        sub: 'u1',
        role: 'user',
        tokenVersion: 3,
        purpose: 'access',
      },
      undefined,
    );
  });

  it('signs reset tokens when purpose is reset', () => {
    service.generateToken(user, { purpose: 'reset', expiresIn: '15m' });
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: 'reset' }),
      { expiresIn: '15m' },
    );
  });

  it('accepts access tokens and defaults missing purpose to access', () => {
    jwtService.verify.mockReturnValue({
      sub: 'u1',
      email: 'a@test.com',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    const payload = service.verifyToken('jwt');
    expect(payload.purpose).toBe('access');
  });

  it('rejects a reset token when an access token is required', () => {
    jwtService.verify.mockReturnValue({
      sub: 'u1',
      purpose: 'reset',
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    expect(() => service.verifyToken('jwt')).toThrow(UnauthorizedException);
  });

  it('accepts a reset token when that purpose is expected', () => {
    jwtService.verify.mockReturnValue({
      sub: 'u1',
      purpose: 'reset',
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    expect(service.verifyToken('jwt', 'reset').purpose).toBe('reset');
  });
});
