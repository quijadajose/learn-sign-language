import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import * as Sentry from '@sentry/nestjs';
import { IsString, MinLength } from 'class-validator';
import { CreateUserDto } from '../domain/dto/create-user/create-user';
import { AuthService } from '../application/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ResetPassword } from '../application/dto/reset-password/reset-password';
import { ConfirmResetPasswordDto } from '../application/dto/confirm-reset-password/confirm-reset-password-dto';
import { LoginUserDto } from '../application/dto/login-user/login-user';
import { Public } from './decorators/public.decorator';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { OAuthCodeStore } from './oauth-code.store';
import {
  DocAuth,
  DocConfirmPasswordReset,
  DocGoogleAuth,
  DocGoogleAuthRedirect,
  DocLogin,
  DocRegister,
  DocRequestPasswordReset,
} from './docs/auth.docs';

class ExchangeGoogleCodeDto {
  @IsString()
  @MinLength(16)
  code: string;
}

@DocAuth()
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly oauthCodeStore: OAuthCodeStore,
  ) {}
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @DocRegister()
  async register(@Body() createUserDto: CreateUserDto) {
    createUserDto.role = 'user';
    const user = await this.authService.registerUser(createUserDto);
    return {
      message: 'User registered successfully',
      data: user,
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @DocLogin()
  async login(@Body() user: LoginUserDto) {
    const token = await this.authService.login(user);
    return {
      message: 'User logged in successfully',
      data: token,
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('password/reset')
  @DocRequestPasswordReset()
  async requestPasswordReset(@Body() resetPasswordDto: ResetPassword) {
    const { email } = resetPasswordDto;
    this.authService.sendPasswordResetToken(email).catch((error) => {
      Sentry.captureException(error);
      this.logger.error(
        'Error in sendPasswordResetToken in background:',
        error,
      );
    });
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('password/reset/confirm')
  @DocConfirmPasswordReset()
  async confirmPasswordReset(
    @Body() confirmResetPasswordDto: ConfirmResetPasswordDto,
  ) {
    const { token, newPassword } = confirmResetPasswordDto;
    try {
      await this.authService.resetPassword(token, newPassword);
      return { message: 'Password has been successfully reset.' };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Password reset failed';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @DocGoogleAuth()
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @DocGoogleAuthRedirect()
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const payload = req.user;
    if (!payload) {
      throw new HttpException('No user data found', HttpStatus.UNAUTHORIZED);
    }
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const code = await this.oauthCodeStore.create(payload.access_token, {
      id: payload.sub,
      email: payload.email,
    });
    res.redirect(302, `${frontendUrl}/login?code=${code}`);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('google/exchange')
  async exchangeGoogleCode(@Body() body: ExchangeGoogleCodeDto) {
    const result = await this.oauthCodeStore.consume(body.code);
    if (!result) {
      throw new UnauthorizedException('Invalid or expired OAuth code');
    }
    return {
      message: 'User logged in successfully',
      data: {
        token: result.accessToken,
      },
    };
  }
}
