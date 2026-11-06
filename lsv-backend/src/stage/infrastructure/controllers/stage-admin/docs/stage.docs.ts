import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StageDto } from '../../../../../shared/domain/dto/create-stage/create-stage-dto.js';
import { DocOp } from '../../../../../shared/infrastructure/openapi/doc-op.js';
import {
  PaginatedStageResponseDto,
  StageResponseDto,
} from '../../../../../shared/infrastructure/openapi/resource-responses.js';

export const DocStage = () => applyDecorators(ApiTags('Stage'));

export const DocCreateStage = () =>
  DocOp({
    summary: 'Crear etapa',
    body: StageDto,
    status: 201,
    forbidden: true,
    okType: StageResponseDto,
  });

export const DocUpdateStage = () =>
  DocOp({
    summary: 'Actualizar etapa',
    body: StageDto,
    status: 204,
    forbidden: true,
    notFound: true,
  });

export const DocDeleteStage = () =>
  DocOp({
    summary: 'Eliminar etapa',
    status: 204,
    forbidden: true,
    notFound: true,
  });

export const DocGetStagesByLanguageId = () =>
  DocOp({
    summary: 'Listar etapas de un lenguaje',
    description: 'El :id es el languageId. Soporta page y limit.',
    forbidden: true,
    notFound: true,
    okType: PaginatedStageResponseDto,
  });
