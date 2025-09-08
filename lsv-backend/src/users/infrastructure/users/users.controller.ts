import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from 'src/auth/application/auth.service';
import { UpdateUserDto } from 'src/auth/domain/dto/update-user/update-user';
import { LanguageService } from 'src/language/application/services/language/language-admin.service';
import { LessonService } from 'src/lesson/application/services/lesson/lesson.service';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { Language } from 'src/shared/domain/entities/language';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { UserLanguage } from 'src/shared/domain/entities/userLanguage';
import { UsersService } from 'src/users/application/users/users.service';
import { EnrollUserInLanguageDto } from './enroll-user-in-language.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly languageService: LanguageService,
    private readonly lessonAdminService: LessonService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async profile(@Req() req) {
    const user = await this.authService.getUserProfile(req.user.sub);
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
      req.user.sub,
      updateUserDto,
    );
    user.hashPassword = undefined;
    user.googleId = undefined;
    user.updatedAt = undefined;
    return user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('languages')
  async listLanguages(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Language>> {
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
  ): Promise<PaginatedResponseDto<Lesson>> {
    return this.lessonAdminService.getLessonsByLanguage(languageId, pagination);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('lesson/:id')
  async getLessonById(@Param('id', ParseUUIDPipe) id: string): Promise<Lesson> {
    return this.lessonAdminService.getLessonById(id);
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('enrolled-languages')
  findUserLanguages(
    @Req() req,
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserLanguage>> {
    return this.usersService.findUserLanguages(req.user.sub, pagination);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('enroll')
  enroll(
    @Req() req,
    @Body() enrollDto: EnrollUserInLanguageDto,
  ): Promise<UserLanguage> {
    return this.usersService.enrollUserInLanguage(
      req.user.sub,
      enrollDto.languageId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('stages-progress/:languageId')
  getStagesProgress(
    @Req() req,
    @Param('languageId', ParseUUIDPipe) languageId: string,
  ): Promise<any> {
    const userId = req.user.sub;
    return this.usersService.getStagesProgress(userId, languageId);
  }
}
