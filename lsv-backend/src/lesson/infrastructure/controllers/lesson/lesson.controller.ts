import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateLessonDto } from 'src/lesson/domain/dto/create-lesson/create-lesson-dto';
import { LessonService } from 'src/lesson/application/services/lesson/lesson.service';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { RequireResourcePermission } from 'src/auth/infrastructure/decorators/require-resource-permission.decorator';
import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';
import { ResourceAccessGuard } from 'src/auth/infrastructure/guards/resource-access/resource-access.guard';
import { Lesson } from 'src/shared/domain/entities/lesson';
import * as path from 'path';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { GetLessonsQueryDto } from 'src/lesson/domain/dto/get-lessons-query-dto';
import { GetLessonsWithSubmissionsQueryDto } from 'src/lesson/domain/dto/get-lessons-with-submissions-query-dto';
import { AuthGuard } from '@nestjs/passport';
import { CreateLessonVariantDto } from 'src/lesson/domain/dto/create-lesson-variant/create-lesson-variant-dto';
import { LessonVariant } from 'src/shared/domain/entities/lessonVariant';

@Controller('lesson')
export class LessonController {
  constructor(private readonly lessonAdminService: LessonService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get('by-language/:languageId')
  async getLessonsByLanguage(
    @Param('languageId', ParseUUIDPipe) languageId: string,
    @Query() query: GetLessonsQueryDto,
  ): Promise<PaginatedResponseDto<Lesson>> {
    return this.lessonAdminService.getLessonsByLanguage(
      languageId,
      query,
      query.stageId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('by-language/:languageId/with-submissions')
  async getLessonsByLanguageWithSubmissions(
    @Param('languageId', ParseUUIDPipe) languageId: string,
    @Query() query: GetLessonsWithSubmissionsQueryDto,
    @Req() req,
  ): Promise<PaginatedResponseDto<Lesson>> {
    const userId = req.user.sub;
    if (!req.user || !userId) {
      throw new BadRequestException('User ID is missing from the request.');
    }

    return this.lessonAdminService.getLessonsByLanguageWithSubmissions(
      languageId,
      userId,
      query,
      query.stageId,
      query.regionId,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get()
  async findAll(
    @Query() query: GetLessonsQueryDto,
  ): Promise<PaginatedResponseDto<Lesson>> {
    if (!query.languageId) {
      throw new BadRequestException('languageId is required');
    }
    return this.lessonAdminService.getLessonsByLanguage(
      query.languageId,
      query,
      query.stageId,
    );
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, { body: 'languageId' }, { allowRegionModerators: true })
  @Post()
  async create(@Body() createLessonDto: CreateLessonDto): Promise<Lesson> {
    return this.lessonAdminService.createLesson(createLessonDto);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, {
    param: 'id',
    resolve: 'lesson.languageId',
  }, { allowRegionModerators: true })
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/lesson',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          const name = path.basename(file.originalname, ext);
          cb(null, `${name}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed!'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadImage(
    @Param('id', ParseUUIDPipe) lessonId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string; imageUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const imageUrl = `/uploads/lesson/${file.filename}`;
    await this.lessonAdminService.saveLessonImage(lessonId, file);

    return {
      message: 'Image uploaded successfully',
      imageUrl,
    };
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('by-language/:languageId')
  async getLessonsByLanguageAdmin(
    @Param('languageId', ParseUUIDPipe) languageId: string,
    @Query() query: GetLessonsQueryDto,
  ): Promise<PaginatedResponseDto<Lesson>> {
    return this.lessonAdminService.getLessonsByLanguage(
      languageId,
      query,
      query.stageId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/with-quizzes')
  async getLessonWithQuizzes(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Lesson> {
    return this.lessonAdminService.getLessonWithQuizzes(id);
  }
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/quizzes')
  async getQuizzesByLessonId(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('regionId') regionId?: string,
  ): Promise<any> {
    return this.lessonAdminService.getQuizzesByLessonId(id, regionId);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, {
    param: 'id',
    resolve: 'lesson.languageId',
  }, { allowRegionModerators: true })
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createLessonDto: CreateLessonDto,
  ): Promise<Lesson> {
    return this.lessonAdminService.updateLesson(id, createLessonDto);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, {
    param: 'id',
    resolve: 'lesson.languageId',
  }, { allowRegionModerators: true })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.lessonAdminService.deleteLesson(id);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, {
    param: 'id',
    resolve: 'lesson.languageId',
  }, { allowRegionModerators: true })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Lesson> {
    return this.lessonAdminService.getLessonById(id);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, {
    param: 'id',
    resolve: 'lesson.languageId',
  }, { allowRegionModerators: true })
  @Get(':id/variants')
  async getLessonVariants(
    @Param('id', ParseUUIDPipe) lessonId: string,
  ): Promise<LessonVariant[]> {
    return this.lessonAdminService.getLessonVariants(lessonId);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.REGION, { body: 'regionId' })
  @Post(':id/variants')
  async createLessonVariant(
    @Param('id', ParseUUIDPipe) lessonId: string,
    @Body() createVariantDto: CreateLessonVariantDto,
  ): Promise<LessonVariant> {
    return this.lessonAdminService.createLessonVariant(
      lessonId,
      createVariantDto,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get(':id/variants/:variantId')
  async getLessonVariant(
    @Param('id', ParseUUIDPipe) lessonId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ): Promise<LessonVariant> {
    return this.lessonAdminService.getLessonVariant(lessonId, variantId);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.REGION, {
    param: 'variantId',
    resolve: 'variant.regionId',
  })
  @Put(':id/variants/:variantId')
  async updateLessonVariant(
    @Param('id', ParseUUIDPipe) lessonId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() updateVariantDto: CreateLessonVariantDto,
  ): Promise<LessonVariant> {
    return this.lessonAdminService.updateLessonVariant(
      lessonId,
      variantId,
      updateVariantDto,
    );
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.REGION, {
    param: 'variantId',
    resolve: 'variant.regionId',
  })
  @Delete(':id/variants/:variantId')
  async deleteLessonVariant(
    @Param('id', ParseUUIDPipe) lessonId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ): Promise<{ message: string }> {
    await this.lessonAdminService.deleteLessonVariant(lessonId, variantId);
    return { message: 'Lesson variant deleted successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('regional/:id')
  async getRegionalLesson(
    @Param('id', ParseUUIDPipe) lessonId: string,
    @Query('regionId') regionId?: string,
  ): Promise<Lesson | LessonVariant> {
    return this.lessonAdminService.getRegionalLesson(lessonId, regionId);
  }
}
