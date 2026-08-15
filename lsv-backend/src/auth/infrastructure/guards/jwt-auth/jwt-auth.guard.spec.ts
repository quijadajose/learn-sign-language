import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenService } from 'src/auth/domain/ports/token.service/token.service.interface';
import { UserRepositoryInterface } from 'src/auth/domain/ports/user.repository.interface/user.repository.interface';

function mockContext(headers: Record<string, string> = {}): ExecutionContext {
  const request = { headers, user: undefined as unknown };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const tokenService = {
    verifyToken: jest.fn(),
  };
  const userRepository = {
    findAuthStateById: jest.fn(),
  };
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(false),
  };
  const guard = new JwtAuthGuard(
    tokenService as unknown as TokenService,
    userRepository as unknown as UserRepositoryInterface,
    reflector as unknown as Reflector,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockReturnValue(false);
  });

  it('allows public routes', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(mockContext())).resolves.toBe(true);
    expect(tokenService.verifyToken).not.toHaveBeenCalled();
  });

  it('rejects a reset token used as access', async () => {
    tokenService.verifyToken.mockImplementation(() => {
      throw new UnauthorizedException('errors.auth.invalidToken');
    });
    await expect(
      guard.canActivate(mockContext({ authorization: 'Bearer reset-jwt' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when tokenVersion no longer matches', async () => {
    tokenService.verifyToken.mockReturnValue({
      sub: 'u1',
      email: 'a@test.com',
      tokenVersion: 0,
    });
    userRepository.findAuthStateById.mockResolvedValue({
      id: 'u1',
      role: 'user',
      tokenVersion: 1,
    });
    await expect(
      guard.canActivate(mockContext({ authorization: 'Bearer access-jwt' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the live role from the database', async () => {
    tokenService.verifyToken.mockReturnValue({
      sub: 'u1',
      email: 'a@test.com',
      role: 'user',
      tokenVersion: 2,
    });
    userRepository.findAuthStateById.mockResolvedValue({
      id: 'u1',
      role: 'admin',
      tokenVersion: 2,
    });
    const ctx = mockContext({ authorization: 'Bearer access-jwt' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(ctx.switchToHttp().getRequest().user).toEqual({
      sub: 'u1',
      email: 'a@test.com',
      role: 'admin',
    });
  });
});
