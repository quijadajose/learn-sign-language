import { Body, Controller, Get, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LanguageAdminService } from 'src/admin/application/services/language-admin/language-admin.service';
import { AuthService } from 'src/auth/application/auth.service';
import { UpdateUserDto } from 'src/auth/application/dtos/update-user/update-user';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { Language } from 'src/shared/domain/entities/language';

@Controller('users')
export class UsersController {
    constructor(
        private readonly authService: AuthService,
        private readonly languageAdminService: LanguageAdminService,
    ) { }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async profile(@Req() req) {
        const user = await this.authService.getUserProfile(req.user.userId);
        user.hashPassword = undefined;
        user.googleId = undefined;
        user.updatedAt = undefined;
        return user;
    }

    @Put('me')
    @UseGuards(AuthGuard('jwt'))
    async updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
        updateUserDto.role = undefined;
        const user = await this.authService.updateUserProfile(req.user.userId, updateUserDto);
        user.hashPassword = undefined;
        user.googleId = undefined;
        user.updatedAt = undefined;
        return user;
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('languages')
    async listLanguages(@Query() pagination: PaginationDto): Promise<Language[]> {
        return this.languageAdminService.getAllLanguages(pagination);
    }
}
