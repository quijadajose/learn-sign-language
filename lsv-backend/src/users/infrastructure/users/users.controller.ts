import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from 'src/auth/application/auth.service';

@Controller('users')
export class UsersController {
    constructor(private readonly authService: AuthService) { }
    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async profile(@Req() req) {
        const user = await this.authService.getUserProfile(req.user.userId);
        user.hashPassword = undefined;
        user.googleId = undefined;
        user.updatedAt = undefined;
        return user;
    }
}
