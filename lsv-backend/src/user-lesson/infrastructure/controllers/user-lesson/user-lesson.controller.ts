import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
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
  startLesson(@Req() req, @Body('lessonId') lessonId: string) {
    const userId = req.user.sub;
    return this.userLessonService.startLesson(userId, lessonId);
  }

  @Post('set-lesson-completion')
  setLessonCompletion(
    @Req() req,
    @Body('lessonId') lessonId: string,
    @Body('isComplete') isComplete: boolean,
  ) {
    const userId = req.user.sub;
    return this.userLessonService.setLessonCompletion(
      userId,
      lessonId,
      isComplete,
    );
  }
}
