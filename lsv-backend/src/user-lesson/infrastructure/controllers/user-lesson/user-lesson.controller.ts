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
import { PaginationDto } from '../../../../shared/domain/dto/PaginationDto.js';
import { UserLessonService } from '../../../application/services/user-lesson/user-lesson.service.js';
import {
  SetLessonCompletionDto,
  StartLessonDto,
} from '../../../domain/dto/user-lesson.dto.js';
import {
  DocGetUserLessonByUser,
  DocSetLessonCompletion,
  DocStartLesson,
  DocUserLesson,
} from './docs/user-lesson.docs.js';

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

  // BE-23: la finalización la declara el cliente y no hay prueba del servidor.
  // No usar para ranking, certificados ni nada con valor sin validación adicional.
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
