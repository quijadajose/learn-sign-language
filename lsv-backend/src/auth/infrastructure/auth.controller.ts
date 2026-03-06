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
} from '@nestjs/common';
import { CreateUserDto } from '../domain/dto/create-user/create-user';
import { AuthService } from '../application/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ResetPassword } from '../application/dto/reset-password/reset-password';
import { ConfirmResetPasswordDto } from '../application/dto/confirm-reset-password/confirm-reset-password-dto';
import { LoginUserDto } from '../application/dto/login-user/login-user';
import { Public } from './decorators/public.decorator';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  DocAuth,
  DocConfirmPasswordReset,
  DocGoogleAuth,
  DocGoogleAuthRedirect,
  DocLogin,
  DocRegister,
  DocRequestPasswordReset,
} from './docs/auth.docs';

@DocAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  @Public()
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
  @Post('password/reset')
  @DocRequestPasswordReset()
  async requestPasswordReset(@Body() resetPasswordDto: ResetPassword) {
    const { email } = resetPasswordDto;
    await this.authService.sendPasswordResetToken(email);
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  @Public()
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
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
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
    res.redirect(302, `${frontendUrl}/login?token=${payload.access_token}`);
  }
}
