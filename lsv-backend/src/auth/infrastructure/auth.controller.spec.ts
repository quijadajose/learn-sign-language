import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../application/auth.service';
import { AuthServiceMock } from '../application/__mocks__/auth.service';
import { CreateUserDto } from '../domain/dto/create-user/create-user';
import { LoginUserDto } from '../application/dto/login-user/login-user';
import { ConfigService } from '@nestjs/config';
import { OAuthCodeStore } from './oauth-code.store';
import { UnauthorizedException } from '@nestjs/common';

function mockRes() {
  return { cookie: jest.fn(), clearCookie: jest.fn() };
}

describe('AuthController', () => {
  let authController: AuthController;
  let oauthCodeStore: {
    create: jest.Mock;
    consume: jest.Mock;
  };

  beforeEach(async () => {
    oauthCodeStore = {
      create: jest.fn(),
      consume: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: AuthServiceMock },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:8080') },
        },
        { provide: OAuthCodeStore, useValue: oauthCodeStore },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    it('should register a user and return a success message', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        age: 30,
        firstName: 'Test',
        lastName: 'User',
        isRightHanded: true,
        role: 'user',
      };

      const result = await authController.register(dto);

      expect(result).toEqual({
        message: 'success.auth.registered',
      });
    });
  });

  describe('login', () => {
    it('should log in a user without returning the JWT', async () => {
      const dto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const res = mockRes();

      const result = await authController.login(dto, res as never);

      expect(res.cookie).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'success.auth.loggedIn',
        data: {
          user: { id: '123', email: 'test@example.com', username: 'testuser' },
        },
      });
    });
  });

  describe('password reset', () => {
    it('should send a password reset token', async () => {
      const result = await authController.requestPasswordReset({
        email: 'test@example.com',
      });
      expect(result).toEqual({
        message: 'success.auth.resetLinkSent',
      });
    });

    it('should reset the password successfully', async () => {
      const result = await authController.confirmPasswordReset({
        token: 'valid-reset-token',
        newPassword: 'newpassword123',
      });

      expect(result).toEqual({
        message: 'success.auth.passwordReset',
      });
    });
  });

  describe('logout', () => {
    it('clears the access cookie and invalidates the session', async () => {
      const res = mockRes();
      const result = await authController.logout(
        { headers: { cookie: 'lsv_access=jwt' } } as never,
        res as never,
      );
      expect(AuthServiceMock.invalidateSession).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalled();
      expect(result).toEqual({ message: 'success.auth.loggedOut' });
    });
  });

  describe('google exchange', () => {
    it('exchanges a valid one-time code', async () => {
      oauthCodeStore.consume.mockResolvedValue({
        accessToken: 'access-token',
        user: { id: 'u1' },
      });
      const result = await authController.exchangeGoogleCode(
        { code: 'valid-code' },
        mockRes() as never,
      );
      expect(result).toEqual({
        message: 'success.auth.loggedIn',
      });
    });

    it('rejects invalid codes', async () => {
      oauthCodeStore.consume.mockResolvedValue(null);
      await expect(
        authController.exchangeGoogleCode(
          { code: 'not-a-valid-code-here' },
          mockRes() as never,
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
