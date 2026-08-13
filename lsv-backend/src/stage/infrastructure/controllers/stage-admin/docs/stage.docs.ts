import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StageDto } from 'src/shared/domain/dto/create-stage/create-stage-dto';
import { DocOp } from 'src/shared/infrastructure/openapi/doc-op';
import {
  PaginatedStageResponseDto,
  StageResponseDto,
} from 'src/shared/infrastructure/openapi/resource-responses';

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
