import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';

export const DocSignRecord = () => applyDecorators(ApiTags('SignRecord'));
export const DocSignRecordInternal = () =>
  applyDecorators(ApiTags('SignRecord - Internal'));
export const DocSaveLandmarks = () =>
  applyDecorators(
    ApiOperation({ summary: 'Guardar landmarks grabados para una seña' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          signId: { type: 'string', format: 'uuid' },
          regionId: { type: 'string', format: 'uuid' },
          landmarks: { type: 'array', items: { type: 'object' } },
          dominantHand: { type: 'string', enum: ['left', 'right'] },
        },
        required: ['signId', 'landmarks'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Landmarks guardados exitosamente',
    }),
  );

export const DocGetSignRecordings = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener todas las grabaciones de una seña específica',
    }),
    ApiParam({ name: 'signId', format: 'uuid' }),
    ApiResponse({ status: 200, description: 'Lista de grabaciones' }),
  );

export const DocTriggerCustomTraining = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Iniciar entrenamiento personalizado con filtros',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          languageId: { type: 'string', format: 'uuid' },
          regionId: { type: 'string', format: 'uuid' },
          stageIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
          },
          signIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
          modelName: { type: 'string' },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Entrenamiento iniciado' }),
  );

export const DocTriggerTraining = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Iniciar entrenamiento para una variante de lección específica',
    }),
    ApiParam({ name: 'lessonVariantId', format: 'uuid' }),
    ApiResponse({ status: 201, description: 'Entrenamiento iniciado' }),
  );

export const DocGetGlobalSigns = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener señas globales (ej. "none")' }),
    ApiResponse({ status: 200, description: 'Lista de señas globales' }),
  );

export const DocGetLessonSigns = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener señas asociadas a una lección' }),
    ApiParam({ name: 'lessonId', format: 'uuid' }),
    ApiResponse({ status: 200, description: 'Lista de señas de la lección' }),
  );

export const DocGetModels = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener todos los modelos de entrenamiento y su estado',
    }),
    ApiQuery({ type: PaginationDto }),
    ApiResponse({ status: 200, description: 'Lista de modelos' }),
  );

export const DocDeleteModel = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Eliminar un registro de modelo de entrenamiento',
    }),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiResponse({ status: 200, description: 'Modelo eliminado' }),
  );

export const DocDeleteRecording = () =>
  applyDecorators(
    ApiOperation({ summary: 'Eliminar una grabación de seña específica' }),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiResponse({ status: 200, description: 'Grabación eliminada' }),
  );

export const DocCreateSign = () =>
  applyDecorators(
    ApiOperation({ summary: 'Crear una nueva seña' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          lessonId: { type: 'string', format: 'uuid' },
          isGlobal: { type: 'boolean' },
        },
        required: ['name'],
      },
    }),
    ApiResponse({ status: 201, description: 'Seña creada' }),
  );

export const DocUpdateSign = () =>
  applyDecorators(
    ApiOperation({ summary: 'Actualizar el nombre de una seña' }),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      },
    }),
    ApiResponse({ status: 200, description: 'Seña actualizada' }),
  );

export const DocDeleteSign = () =>
  applyDecorators(
    ApiOperation({ summary: 'Eliminar una seña' }),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiResponse({ status: 200, description: 'Seña eliminada' }),
  );

export const DocUpdateModelStatus = () =>
  applyDecorators(
    ApiOperation({
      summary: '[Internal] Actualizar estado de entrenamiento del modelo',
    }),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'TRAINING', 'READY', 'FAILED'],
          },
        },
        required: ['status'],
      },
    }),
    ApiResponse({ status: 200, description: 'Estado actualizado' }),
  );

export const DocReportProgress = () =>
  applyDecorators(
    ApiOperation({ summary: '[Internal] Reportar progreso de entrenamiento' }),
    ApiParam({ name: 'lessonVariantId', format: 'uuid' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          progress: { type: 'number' },
          accuracy: { type: 'number' },
        },
        required: ['progress', 'accuracy'],
      },
    }),
    ApiResponse({ status: 201, description: 'Progreso reportado' }),
  );

export const DocModelReady = () =>
  applyDecorators(
    ApiOperation({
      summary:
        '[Internal] Notificar que el entrenamiento del modelo ha finalizado',
    }),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiBody({
      schema: {
        type: 'object',
      },
    }),
    ApiResponse({ status: 201, description: 'Notificación recibida' }),
  );
