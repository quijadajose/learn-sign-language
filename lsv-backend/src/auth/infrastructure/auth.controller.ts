import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from '../application/dtos/create-user/create-user';
import { AuthService } from '../application/auth.service';

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
}
