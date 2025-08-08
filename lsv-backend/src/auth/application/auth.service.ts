import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserUseCase } from '../domain/use-cases/register-user/register-user';
import { CreateUserDto } from '../domain/dto/create-user/create-user';
import { User } from 'src/shared/domain/entities/user';
import { TokenService } from '../domain/ports/token.service/token.service.interface';
import { SendEmailUseCase } from '../domain/use-cases/send-email/send-email';
import { EmailParams } from '../domain/ports/email.service/email.service.interface';
import { ConfigService } from '@nestjs/config';
import { FindUserUseCase } from '../domain/use-cases/find-user/find-user';
import { HashService } from '../domain/ports/hash.service.interface/hash.service.interface';
import { UpdateUserUseCase } from '../domain/use-cases/update-user/update-user';
import { LoginUserDto } from './dto/login-user/login-user';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UpdateUserDto } from '../domain/dto/update-user/update-user';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly sendEmailUseCase: SendEmailUseCase,
    @Inject('TokenService')
    private readonly tokenService: TokenService,
    @Inject('HashService')
    private readonly hashService: HashService,
  ) {}
  async registerUser(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    const user = await this.registerUserUseCase.register(createUserDto);
    user.hashPassword = undefined;
    user.googleId = undefined;
    user.updatedAt = undefined;
    const token = this.generateToken(user);
    return { user, token };
  }
  async login(
    loginUserDto: LoginUserDto,
  ): Promise<{ user: User; token: string }> {
    const user = await this.findUserUseCase.findByEmail(loginUserDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashService.compare(
      loginUserDto.password,
      user.hashPassword,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);
    user.hashPassword = undefined;
    user.googleId = undefined;
    user.updatedAt = undefined;
    return { user, token };
  }
  generateToken(payload: User, expiresIn?: string): string {
    return this.tokenService.generateToken(payload, expiresIn);
  }
  async sendPasswordResetToken(email: string): Promise<void> {
    const user = await this.findUserUseCase.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const resetToken = this.generateToken(user, '15m');
    const frontEndUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontEndUrl}/reset-password?token=${resetToken}`;

    const emailParams: EmailParams = {
      to: email,
      subject: 'Password Reset',
      body: `Please click the following link to reset your password: ${resetUrl}`,
    };

    await this.sendEmailUseCase.execute(emailParams);
  }
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const payload: JwtPayload = this.tokenService.verifyToken(token);

    if (!payload) {
      throw new BadRequestException('Invalid or expired token');
    }

    const { sub: userId } = payload;

    const user = await this.findUserUseCase.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.hashPassword = await this.hashService.hash(newPassword);

    await this.updateUserUseCase.execute(userId, user);

    const emailParams: EmailParams = {
      to: user.email,
      subject: 'Password Changed',
      body: 'Your password has been successfully updated.',
    };
    await this.sendEmailUseCase.execute(emailParams);
  }
  async getUserProfile(userId: string): Promise<User> {
    const user = await this.findUserUseCase.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
  async updateUserProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findUserUseCase.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (updateUserDto.oldPassword && updateUserDto.newPassword) {
      const isCurrentPassword = await this.hashService.compare(
        updateUserDto.oldPassword,
        user.hashPassword,
      );
      if (!isCurrentPassword) {
        throw new BadRequestException('Current password does not match');
      }

      const isSamePassword = await this.hashService.compare(
        updateUserDto.newPassword,
        user.hashPassword,
      );
      if (isSamePassword) {
        throw new BadRequestException(
          'New password must be different from the old password',
        );
      }

      updateUserDto.hashPassword = await this.hashService.hash(
        updateUserDto.newPassword,
      );

      delete updateUserDto.oldPassword;
      delete updateUserDto.newPassword;
    }

    const updatedUser = await this.updateUserUseCase.execute(
      userId,
      updateUserDto,
    );
    return updatedUser;
  }
}
