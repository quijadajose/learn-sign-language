import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateLessonDto } from 'src/admin/application/dtos/create-lesson-dto/create-lesson-dto';
import { LessonAdminService } from 'src/admin/application/services/lesson-admin/lesson-admin.service';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { Lesson } from 'src/shared/domain/entities/lesson';
import * as path from 'path';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';

@Controller('lesson')
export class LessonAdminController {
    constructor(private readonly lessonAdminService: LessonAdminService) {}

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Post()
    async create(@Body() createLessonDto: CreateLessonDto): Promise<Lesson> {
        return this.lessonAdminService.createLesson(createLessonDto);
    }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Post('upload-image')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/tmp',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, uniqueSuffix + path.extname(file.originalname));
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.startsWith('image/')) {
                    return cb(new BadRequestException('Only images are allowed'), false);
                }
                cb(null, true);
            },
        })
    )
    async uploadImage(@UploadedFile() file: Express.Multer.File, @Body('lessonId') lessonId: string) {
        return await this.lessonAdminService.saveLessonImage(lessonId, file);
    }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Get('by-language/:languageId')
    async getLessonsByLanguage(@Param('languageId',ParseUUIDPipe) languageId: string,@Query() pagination: PaginationDto): Promise<Lesson[]> {
        return this.lessonAdminService.getLessonsByLanguage(languageId,pagination);
    }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Get(':id')
    async getLessonById(@Param('id',ParseUUIDPipe) id: string): Promise<Lesson> {
        return this.lessonAdminService.getLessonById(id);
    }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Put(':id')
    async update(@Param('id',ParseUUIDPipe) id: string, @Body() createLessonDto: CreateLessonDto): Promise<Lesson> {
        return this.lessonAdminService.updateLesson(id, createLessonDto);
    }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Delete(':id')
    async delete(@Param('id',ParseUUIDPipe) id: string): Promise<void> {
        return this.lessonAdminService.deleteLesson(id);
    }
}
