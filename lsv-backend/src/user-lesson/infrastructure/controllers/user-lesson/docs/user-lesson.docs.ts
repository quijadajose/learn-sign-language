import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  SetLessonCompletionDto,
  StartLessonDto,
} from '../../../../domain/dto/user-lesson.dto.js';
import { DocOp } from '../../../../../shared/infrastructure/openapi/doc-op.js';
import {
  PaginatedUserLessonResponseDto,
  UserLessonResponseDto,
} from '../../../../../shared/infrastructure/openapi/resource-responses.js';

export const DocUserLesson = () => applyDecorators(ApiTags('UserLesson'));

export const DocGetUserLessonByUser = () =>
  DocOp({
    summary: 'Listar progreso de lecciones de un usuario',
    description:
      'Lista paginada del progreso del usuario autenticado. Un admin puede consultar otro UUID.',
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
