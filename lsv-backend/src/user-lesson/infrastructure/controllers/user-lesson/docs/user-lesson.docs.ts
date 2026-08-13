import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  SetLessonCompletionDto,
  StartLessonDto,
} from 'src/user-lesson/domain/dto/user-lesson.dto';
import { DocOp } from 'src/shared/infrastructure/openapi/doc-op';
import {
  PaginatedUserLessonResponseDto,
  UserLessonResponseDto,
} from 'src/shared/infrastructure/openapi/resource-responses';

export const DocUserLesson = () => applyDecorators(ApiTags('UserLesson'));

export const DocGetUserLessonByUser = () =>
  DocOp({
    summary: 'Listar progreso de lecciones de un usuario',
    description: 'Lista paginada. Requiere JWT.',
    okType: PaginatedUserLessonResponseDto,
  });

export const DocStartLesson = () =>
  DocOp({
    summary: 'Iniciar una lección',
    body: StartLessonDto,
    status: 201,
    okType: UserLessonResponseDto,
  });

export const DocSetLessonCompletion = () =>
  DocOp({
    summary: 'Marcar lección como completada o no',
    body: SetLessonCompletionDto,
    status: 201,
    okType: UserLessonResponseDto,
  });
