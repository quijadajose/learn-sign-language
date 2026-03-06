import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { UserLessonService } from 'src/user-lesson/application/services/user-lesson/user-lesson.service';

@Controller('user-lesson')
@UseGuards(AuthGuard('jwt'))
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
    @Req() req,
    @Body('lessonId') lessonId: string,
    @Body('regionId') regionId?: string,
  ) {
    const userId = req.user.sub;
    return this.userLessonService.startLesson(userId, lessonId, regionId);
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
