import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateQuizVariantDto } from '../../domain/dto/create-quiz-variant-dto.js';
import { DocOp } from '../../../shared/infrastructure/openapi/doc-op.js';
import {
  MessageResponseDto,
  QuizVariantResponseDto,
} from '../../../shared/infrastructure/openapi/resource-responses.js';

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
