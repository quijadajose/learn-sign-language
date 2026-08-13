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
import {
  BulkSignsResultDto,
  LessonModelResponseDto,
  SignRecordingResponseDto,
  SignResponseDto,
  SuccessFlagDto,
  TrainingQueuedResponseDto,
} from 'src/shared/infrastructure/openapi/resource-responses';

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
      type: SignRecordingResponseDto,
    }),
  );

export const DocGetSignRecordings = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener todas las grabaciones de una seña específica',
    }),
    ApiParam({ name: 'signId', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Lista de grabaciones',
      type: [SignRecordingResponseDto],
    }),
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
    ApiResponse({
      status: 201,
      description: 'Entrenamiento iniciado',
      type: TrainingQueuedResponseDto,
    }),
  );

export const DocTriggerTraining = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Iniciar entrenamiento para una variante de lección específica',
    }),
    ApiParam({ name: 'lessonVariantId', format: 'uuid' }),
    ApiResponse({
      status: 201,
      description: 'Entrenamiento iniciado',
      type: TrainingQueuedResponseDto,
    }),
  );

export const DocGetGlobalSigns = () =>
  applyDecorators(
    ApiOperation({ summary: 'Obtener señas globales (ej. "none")' }),
    ApiResponse({
      status: 200,
      description: 'Lista de señas globales',
      type: [SignResponseDto],
    }),
  );

export const DocGetLessonSigns = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener señas asociadas a una lección',
      description:
        'Intencional: cualquier usuario autenticado (JWT). Usado por SignExam; no restringir a admin/mod.',
    }),
    ApiParam({ name: 'lessonId', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Lista de señas de la lección',
      type: [SignResponseDto],
    }),
  );

export const DocGetLessonModel = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Obtener modelos READY de una lección (estático y/o dinámico según existan)',
      description:
        'Intencional: cualquier usuario autenticado (JWT). SignExam carga TFJS desde modelJsonUrl; /shared/models requiere Bearer.',
    }),
    ApiParam({ name: 'lessonId', format: 'uuid' }),
    ApiQuery({
      name: 'regionId',
      required: false,
      description: 'Filtra modelos de la variante regional',
    }),
    ApiResponse({
      status: 200,
      description: 'Modelos de la lección',
      schema: {
        type: 'object',
        properties: {
          static: {
            nullable: true,
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              modelJsonUrl: { type: 'string' },
              binUrls: { type: 'array', items: { type: 'string' } },
              labels: { type: 'array', items: { type: 'string' } },
              accuracy: { type: 'number' },
              modelType: { type: 'string', enum: ['static', 'dynamic'] },
              featuresCount: { type: 'number' },
              featuresSchemaVersion: { type: 'string', nullable: true },
              status: { type: 'string' },
            },
          },
          dynamic: {
            nullable: true,
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              modelJsonUrl: { type: 'string' },
              binUrls: { type: 'array', items: { type: 'string' } },
              labels: { type: 'array', items: { type: 'string' } },
              accuracy: { type: 'number' },
              modelType: { type: 'string', enum: ['static', 'dynamic'] },
              featuresCount: { type: 'number' },
              featuresSchemaVersion: { type: 'string', nullable: true },
              status: { type: 'string' },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Lección o modelos no encontrados',
    }),
  );

export const DocGetModels = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener todos los modelos de entrenamiento y su estado',
    }),
    ApiQuery({ type: PaginationDto }),
    ApiResponse({
      status: 200,
      description: 'Lista de modelos',
      type: [LessonModelResponseDto],
    }),
  );

export const DocDeleteModel = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Eliminar un registro de modelo de entrenamiento',
    }),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Modelo eliminado',
      type: SuccessFlagDto,
    }),
  );

export const DocDeleteRecording = () =>
  applyDecorators(
    ApiOperation({ summary: 'Eliminar una grabación de seña específica' }),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Grabación eliminada',
      type: SuccessFlagDto,
    }),
  );

export const DocCreateSign = () =>
  applyDecorators(
    ApiOperation({ summary: 'Crear una nueva seña' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          languageId: { type: 'string', format: 'uuid' },
          lessonId: { type: 'string', format: 'uuid' },
          isGlobal: { type: 'boolean' },
          detectionType: { type: 'string', enum: ['static', 'dynamic'] },
        },
        required: ['name', 'languageId'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Seña creada',
      type: SignResponseDto,
    }),
  );

export const DocCreateSignsBulk = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Crear varias señas en una lección (catálogo bulk)',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          languageId: { type: 'string', format: 'uuid' },
          lessonId: { type: 'string', format: 'uuid' },
          signs: {
            type: 'array',
            maxItems: 100,
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                detectionType: { type: 'string', enum: ['static', 'dynamic'] },
              },
              required: ['name'],
            },
          },
        },
        required: ['languageId', 'lessonId', 'signs'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Catálogo creado (created + skipped)',
      type: BulkSignsResultDto,
    }),
  );

export const DocUpdateSign = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Actualizar nombre y/o detectionType de una seña',
    }),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          detectionType: { type: 'string', enum: ['static', 'dynamic'] },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Seña actualizada',
      type: SignResponseDto,
    }),
  );

export const DocDeleteSign = () =>
  applyDecorators(
    ApiOperation({ summary: 'Eliminar una seña' }),
    ApiParam({ name: 'id', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Seña eliminada',
      type: SignResponseDto,
    }),
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
