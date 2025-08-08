import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../application/auth.service';
import { AuthServiceMock } from '../application/__mocks__/auth.service';
import { CreateUserDto } from '../domain/dto/create-user/create-user';
import { LoginUserDto } from '../application/dto/login-user/login-user';

describe('AuthController', () => {
  let authController: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: AuthServiceMock }],
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
        message: 'User registered successfully',
        data: {
          user: { id: '123', email: 'test@example.com', username: 'testuser' },
          token: 'fake-jwt-token',
        },
      });
    });
  });

  describe('login', () => {
    it('should log in a user and return a token', async () => {
      const dto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authController.login(dto);

      expect(result).toEqual({
        message: 'User logged in successfully',
        data: {
          user: { id: '123', email: 'test@example.com', username: 'testuser' },
          token: 'fake-jwt-token',
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
        message: 'If the email exists, a reset link has been sent.',
      });
    });

    it('should reset the password successfully', async () => {
      const result = await authController.confirmPasswordReset({
        token: 'valid-reset-token',
        newPassword: 'newpassword123',
      });

      expect(result).toEqual({
        message: 'Password has been successfully reset.',
      });
    });
  });
});
