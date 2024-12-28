import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CreateUserDto } from '../application/dtos/create-user/create-user';
import { AuthService } from '../application/auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }
    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        const user = await this.authService.registerUser(createUserDto);
        return {
            message: 'User registered successfully',
            data: user,
        };
    }
    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req) {
        // Inicia el flujo de autenticación con Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req) {
        const payload = req.user; // Usuario autenticado
        return payload;
    }
}
