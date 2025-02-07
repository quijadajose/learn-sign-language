import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { UserLessonService } from 'src/user-lesson/application/services/user-lesson/user-lesson.service';

@Controller('user-lesson')
export class UserLessonController {
  constructor(private readonly userLessonService: UserLessonService) {}
  @Get('by-user/:id')
  getUserLessonByUserId(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.userLessonService.getUserLessonByUserId(id, pagination);
  }

  @Post('start')
  startLesson(
    @Body('userId') userId: string,
    @Body('lessonId') lessonId: string,
  ) {
    return this.userLessonService.startLesson(userId, lessonId);
  }

  @Post('set-lesson-completion')
  setLessonCompletion(
    @Body('userId') userId: string,
    @Body('lessonId') lessonId: string,
    @Body('isComplete') isComplete: boolean,
  ) {
    return this.userLessonService.setLessonCompletion(
      userId,
      lessonId,
      isComplete,
    );
  }
}
