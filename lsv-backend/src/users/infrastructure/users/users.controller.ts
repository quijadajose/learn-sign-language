import {
  Body,
  Controller,
  Delete,
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
import { UserRegion } from 'src/shared/domain/entities/userRegion';
import { UsersService } from 'src/users/application/users/users.service';
import { EnrollUserInLanguageDto } from './enroll-user-in-language.dto';
import { GetUserRegionsQueryDto } from './get-user-regions-query.dto';
import {
  DocEnroll,
  DocEnrollRegion,
  DocFindUserLanguages,
  DocFindUserRegions,
  DocGetLanguage,
  DocGetLessonById,
  DocGetStagesProgress,
  DocListLanguages,
  DocUnenrollFromLanguage,
  DocUnenrollFromRegion,
  DocUpdateProfile,
  DocUserProfile,
  DocUsers,
} from './docs/users.docs';

@DocUsers()
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
  @DocUserProfile()
  async profile(@Req() req) {
    const user = await this.authService.getUserProfile(req.user.sub);
    user.hashPassword = undefined;
    user.googleId = undefined;
    user.updatedAt = undefined;
    return user;
  }

  @Put('me')
  @UseGuards(AuthGuard('jwt'))
  @DocUpdateProfile()
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
  @DocListLanguages()
  async listLanguages(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Language>> {
    return this.languageService.getAllLanguages(pagination);
  }

  @Get('languages/:id')
  @DocGetLanguage()
  async getLanguage(@Param('id', ParseUUIDPipe) id: string): Promise<Language> {
    return this.languageService.getLanguage(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('lesson/:id')
  @DocGetLessonById()
  async getLessonById(@Param('id', ParseUUIDPipe) id: string): Promise<Lesson> {
    return this.lessonAdminService.getLessonById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('enrolled-languages')
  @DocFindUserLanguages()
  findUserLanguages(
    @Req() req,
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<any>> {
    return this.usersService.findUserLanguages(req.user.sub, pagination);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('enroll')
  @DocEnroll()
  async enroll(
    @Req() req,
    @Body() enrollDto: EnrollUserInLanguageDto,
  ): Promise<UserLanguage> {
    const userLanguage = await this.usersService.enrollUserInLanguage(
      req.user.sub,
      enrollDto.languageId,
    );

    if (enrollDto.regionId) {
      await this.usersService.enrollUserInRegion(
        req.user.sub,
        enrollDto.regionId,
      );
    }

    return userLanguage;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('stages-progress/:languageId')
  @DocGetStagesProgress()
  getStagesProgress(
    @Req() req,
    @Param('languageId', ParseUUIDPipe) languageId: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<any>> {
    const userId = req.user.sub;
    return this.usersService.getStagesProgress(userId, languageId, pagination);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('enrolled-regions')
  @DocFindUserRegions()
  findUserRegions(
    @Req() req,
    @Query() query: GetUserRegionsQueryDto,
  ): Promise<PaginatedResponseDto<UserRegion>> {
    return this.usersService.findUserRegions(
      req.user.sub,
      query,
      query.languageId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('enroll-region')
  @DocEnrollRegion()
  enrollRegion(
    @Req() req,
    @Body('regionId', ParseUUIDPipe) regionId: string,
  ): Promise<UserRegion> {
    return this.usersService.enrollUserInRegion(req.user.sub, regionId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('enrolled-languages/:languageId')
  @DocUnenrollFromLanguage()
  async unenrollFromLanguage(
    @Req() req,
    @Param('languageId', ParseUUIDPipe) languageId: string,
  ): Promise<{ message: string }> {
    await this.usersService.unenrollUserFromLanguage(req.user.sub, languageId);
    return { message: 'Te has desinscrito del idioma exitosamente.' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('enrolled-regions/:regionId')
  @DocUnenrollFromRegion()
  async unenrollFromRegion(
    @Req() req,
    @Param('regionId', ParseUUIDPipe) regionId: string,
  ): Promise<{ message: string }> {
    await this.usersService.unenrollUserFromRegion(req.user.sub, regionId);
    return { message: 'Te has desinscrito de la región exitosamente.' };
  }
}
