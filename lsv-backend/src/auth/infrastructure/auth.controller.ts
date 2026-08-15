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
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from '../domain/dto/create-user/create-user';
import { AuthService } from '../application/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ResetPassword } from '../application/dto/reset-password/reset-password';
import { ConfirmResetPasswordDto } from '../application/dto/confirm-reset-password/confirm-reset-password-dto';
import { LoginUserDto } from '../application/dto/login-user/login-user';
import { Public } from './decorators/public.decorator';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { OAuthCodeStore } from './oauth-code.store';
import { attachAuthCookie, clearAuthCookie } from './auth-cookie';
import { extractAccessToken } from 'src/shared/infrastructure/extract-access-token';
import {
  DocAuth,
  DocConfirmPasswordReset,
  DocGoogleAuth,
  DocGoogleAuthRedirect,
  DocLogin,
  DocLogout,
  DocRegister,
  DocRequestPasswordReset,
  DocExchangeGoogleCode,
} from './docs/auth.docs';

class ExchangeGoogleCodeDto {
  @ApiProperty({ minLength: 16, example: 'oauth-one-time-code' })
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
    await this.authService.registerUser(createUserDto);
    return {
      message: 'success.auth.registered',
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @DocLogin()
  async login(
    @Body() user: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.login(user);
    attachAuthCookie(res, session.token);
    return {
      message: 'success.auth.loggedIn',
      data: { user: session.user },
    };
  }

  @Public()
  @Post('logout')
  @DocLogout()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.invalidateSession(extractAccessToken(req));
    clearAuthCookie(res);
    return { message: 'success.auth.loggedOut' };
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
    return { message: 'success.auth.resetLinkSent' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('password/reset/confirm')
  @DocConfirmPasswordReset()
  async confirmPasswordReset(
    @Body() confirmResetPasswordDto: ConfirmResetPasswordDto,
  ) {
    const { token, newPassword } = confirmResetPasswordDto;
    await this.authService.resetPassword(token, newPassword);
    return { message: 'success.auth.passwordReset' };
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
    res.redirect(302, `${frontendUrl}/login#code=${encodeURIComponent(code)}`);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('google/exchange')
  @DocExchangeGoogleCode()
  async exchangeGoogleCode(
    @Body() body: ExchangeGoogleCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.oauthCodeStore.consume(body.code);
    if (!result) {
      throw new UnauthorizedException('errors.auth.invalidOAuthCode');
    }
    attachAuthCookie(res, result.accessToken);
    return {
      message: 'success.auth.loggedIn',
    };
  }
}
