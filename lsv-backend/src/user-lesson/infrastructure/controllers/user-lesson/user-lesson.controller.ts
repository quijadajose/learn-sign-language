import {
  Body,
  Controller,
  ForbiddenException,
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
import {
  SetLessonCompletionDto,
  StartLessonDto,
} from 'src/user-lesson/domain/dto/user-lesson.dto';
import {
  DocGetUserLessonByUser,
  DocSetLessonCompletion,
  DocStartLesson,
  DocUserLesson,
} from './docs/user-lesson.docs';

@DocUserLesson()
@Controller('user-lesson')
@UseGuards(AuthGuard('jwt'))
export class UserLessonController {
  constructor(private readonly userLessonService: UserLessonService) {}
  @Get('by-user/:id')
  @DocGetUserLessonByUser()
  getUserLessonByUserId(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    const requesterId = req.user.sub;
    const role = req.user.role;
    if (id !== requesterId && role !== 'admin') {
      throw new ForbiddenException('errors.common.forbidden');
    }
    return this.userLessonService.getUserLessonByUserId(id, pagination);
  }

  @Post('start')
  @DocStartLesson()
  startLesson(@Req() req, @Body() body: StartLessonDto) {
    const userId = req.user.sub;
    return this.userLessonService.startLesson(
      userId,
      body.lessonId,
      body.regionId,
    );
  }

  @Post('set-lesson-completion')
  @DocSetLessonCompletion()
  setLessonCompletion(@Req() req, @Body() body: SetLessonCompletionDto) {
    const userId = req.user.sub;
    return this.userLessonService.setLessonCompletion(
      userId,
      body.lessonId,
      body.isComplete,
    );
  }
}
