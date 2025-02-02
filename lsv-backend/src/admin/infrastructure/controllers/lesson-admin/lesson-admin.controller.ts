import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateLessonDto } from 'src/admin/application/dtos/create-lesson-dto/create-lesson-dto';
import { LessonAdminService } from 'src/admin/application/services/lesson-admin/lesson-admin.service';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { Lesson } from 'src/shared/domain/entities/lesson';

@Controller('lesson')
export class LessonAdminController {
    constructor(private readonly lessonAdminService: LessonAdminService) {}

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Post()
    async create(@Body() createLessonDto: CreateLessonDto): Promise<Lesson> {
        return this.lessonAdminService.createLesson(createLessonDto);
    }
}
