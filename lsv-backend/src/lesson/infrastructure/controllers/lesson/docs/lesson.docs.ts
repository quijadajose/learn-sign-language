import { applyDecorators } from '@nestjs/common';
import { ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateLessonDto } from 'src/lesson/domain/dto/create-lesson/create-lesson-dto';
import { CreateLessonVariantDto } from 'src/lesson/domain/dto/create-lesson-variant/create-lesson-variant-dto';
import { DocOp } from 'src/shared/infrastructure/openapi/doc-op';
import {
  LessonImageResponseDto,
  LessonResponseDto,
  LessonVariantResponseDto,
  MessageResponseDto,
  PaginatedLessonResponseDto,
  QuizPublicDto,
} from 'src/shared/infrastructure/openapi/resource-responses';

export const DocLesson = () => applyDecorators(ApiTags('Lesson'));

export const DocGetLessonsByLanguage = () =>
  DocOp({
    summary: 'Listar lecciones por lenguaje',
    description: 'Lista paginada de lecciones. Acepta page, limit y stageId.',
    notFound: true,
    okType: PaginatedLessonResponseDto,
  });

export const DocGetLessonsWithSubmissions = () =>
  DocOp({
    summary: 'Listar lecciones con envíos del usuario',
    description: 'Incluye el estado de submissions del usuario autenticado.',
    okType: PaginatedLessonResponseDto,
  });

export const DocFindAllLessons = () =>
  DocOp({
    summary: 'Listar lecciones (admin)',
    description: 'Requiere languageId como query param.',
    forbidden: true,
    okType: PaginatedLessonResponseDto,
  });

export const DocCreateLesson = () =>
  DocOp({
    summary: 'Crear lección',
    body: CreateLessonDto,
    status: 201,
    forbidden: true,
    okType: LessonResponseDto,
  });

export const DocUploadLessonImage = () =>
  applyDecorators(
    ApiConsumes('multipart/form-data'),
    DocOp({
      summary: 'Subir imagen de una lección',
      status: 201,
      forbidden: true,
      notFound: true,
      okType: LessonImageResponseDto,
    }),
  );

export const DocGetLessonWithQuizzes = () =>
  DocOp({
    summary: 'Obtener lección con quizzes',
    notFound: true,
    okType: LessonResponseDto,
  });

export const DocGetQuizzesByLesson = () =>
  applyDecorators(
    ApiQuery({ name: 'regionId', required: false }),
    DocOp({
      summary: 'Obtener quizzes de una lección',
      notFound: true,
      okType: QuizPublicDto,
      okIsArray: true,
    }),
  );

export const DocUpdateLesson = () =>
  DocOp({
    summary: 'Actualizar lección',
    body: CreateLessonDto,
    forbidden: true,
    notFound: true,
    okType: LessonResponseDto,
  });

export const DocRemoveLesson = () =>
  DocOp({
    summary: 'Eliminar lección',
    status: 204,
    forbidden: true,
    notFound: true,
  });

export const DocFindOneLesson = () =>
  DocOp({
    summary: 'Obtener lección por ID',
    notFound: true,
    okType: LessonResponseDto,
  });

export const DocGetLessonVariants = () =>
  DocOp({
    summary: 'Listar variantes de una lección',
    forbidden: true,
    okType: LessonVariantResponseDto,
    okIsArray: true,
  });

export const DocCreateLessonVariant = () =>
  DocOp({
    summary: 'Crear variante regional de lección',
    body: CreateLessonVariantDto,
    status: 201,
    forbidden: true,
    okType: LessonVariantResponseDto,
  });

export const DocGetLessonVariant = () =>
  DocOp({
    summary: 'Obtener una variante de lección',
    forbidden: true,
    notFound: true,
    okType: LessonVariantResponseDto,
  });

export const DocUpdateLessonVariant = () =>
  DocOp({
    summary: 'Actualizar variante de lección',
    body: CreateLessonVariantDto,
    forbidden: true,
    notFound: true,
    okType: LessonVariantResponseDto,
  });

export const DocDeleteLessonVariant = () =>
  DocOp({
    summary: 'Eliminar variante de lección',
    forbidden: true,
    notFound: true,
    okType: MessageResponseDto,
  });

export const DocGetRegionalLesson = () =>
  applyDecorators(
    ApiQuery({ name: 'regionId', required: false }),
    DocOp({
      summary: 'Obtener lección regionalizada',
      notFound: true,
      okType: LessonResponseDto,
    }),
  );
