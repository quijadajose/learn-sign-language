import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from 'src/auth/application/auth.service';
import { UpdateUserDto } from 'src/auth/application/dtos/update-user/update-user';
import { LanguageService } from 'src/language/application/services/language/language-admin.service';
import { LessonService } from 'src/lesson/application/services/lesson/lesson.service';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { Language } from 'src/shared/domain/entities/language';
import { Lesson } from 'src/shared/domain/entities/lesson';

@Controller('users')
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly languageService: LanguageService,
    private readonly lessonAdminService: LessonService,
  ) {}

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
    const user = await this.authService.updateUserProfile(
      req.user.userId,
      updateUserDto,
    );
    user.hashPassword = undefined;
    user.googleId = undefined;
    user.updatedAt = undefined;
    return user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('languages')
  async listLanguages(@Query() pagination: PaginationDto): Promise<Language[]> {
    return this.languageService.getAllLanguages(pagination);
  }
  @Get('languages/:id')
  async getLanguage(@Param('id', ParseUUIDPipe) id: string): Promise<Language> {
    return this.languageService.getLanguage(id);
  }
  @Get('lesson-by-language/:languageId')
  async getLessonsByLanguage(
    @Param('languageId', ParseUUIDPipe) languageId: string,
    @Query() pagination: PaginationDto,
  ): Promise<Lesson[]> {
    return this.lessonAdminService.getLessonsByLanguage(languageId, pagination);
  }
}
