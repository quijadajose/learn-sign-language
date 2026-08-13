import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateQuizVariantDto } from 'src/quiz/domain/dto/create-quiz-variant-dto';
import { DocOp } from 'src/shared/infrastructure/openapi/doc-op';
import {
  MessageResponseDto,
  QuizVariantResponseDto,
} from 'src/shared/infrastructure/openapi/resource-responses';

export const DocQuizVariant = () => applyDecorators(ApiTags('QuizVariant'));

export const DocGetQuizVariants = () =>
  DocOp({
    summary: 'Listar variantes de quiz de una lesson variant',
    forbidden: true,
    notFound: true,
    okType: QuizVariantResponseDto,
    okIsArray: true,
  });

export const DocCreateQuizVariant = () =>
  DocOp({
    summary: 'Crear variante de quiz',
    body: CreateQuizVariantDto,
    status: 201,
    forbidden: true,
    okType: QuizVariantResponseDto,
  });

export const DocDeleteQuizVariant = () =>
  DocOp({
    summary: 'Eliminar variante de quiz',
    forbidden: true,
    notFound: true,
    okType: MessageResponseDto,
  });

export const DocUpdateQuizVariant = () =>
  DocOp({
    summary: 'Actualizar variante de quiz',
    body: CreateQuizVariantDto,
    forbidden: true,
    notFound: true,
    okType: QuizVariantResponseDto,
  });
