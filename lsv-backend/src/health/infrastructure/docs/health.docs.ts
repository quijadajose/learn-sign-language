import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export const DocHealth = () => applyDecorators(ApiTags('Health Check'));

const healthResponse = (status: number, description: string, properties: any) =>
  ApiResponse({
    status,
    description,
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: status === 200 ? 'ok' : 'error' },
        info: {
          type: 'object',
          properties,
        },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  });

const errorResponse = ApiResponse({
  status: 503,
  description: 'El servicio no está saludable',
  schema: {
    type: 'object',
    properties: {
      status: { type: 'string', example: 'error' },
      info: { type: 'object' },
      error: { type: 'object' },
      details: { type: 'object' },
    },
  },
});

export const DocCheckApi = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verificar estado del API',
      description: 'Retorna el tiempo de actividad y la versión del backend',
    }),
    healthResponse(200, 'El API está saludable', {
      api: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'up' },
          uptime: { type: 'number', example: 1234.56 },
          timestamp: { type: 'string', example: '2026-03-19T17:15:58Z' },
          version: { type: 'string', example: '0.0.1' },
        },
      },
    }),
    errorResponse,
  );

export const DocCheckDatabase = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verificar estado de la Base de Datos',
      description: 'Comprueba la conexión con la base de datos PostgreSQL',
    }),
    healthResponse(200, 'La base de datos está saludable', {
      database: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'up' },
        },
      },
    }),
    errorResponse,
  );

export const DocCheckValkey = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verificar estado de Valkey/Redis',
      description: 'Comprueba la conexión con el servidor Valkey',
    }),
    healthResponse(200, 'El servidor Valkey está saludable', {
      valkey: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'up' },
        },
      },
    }),
    errorResponse,
  );

export const DocCheckSsl = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verificar estado de SSL',
      description: 'Comprueba la validez y expiración del certificado SSL',
    }),
    healthResponse(200, 'El certificado SSL es válido', {
      ssl: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'up' },
          expiryDate: { type: 'string', example: '2026-12-31T23:59:59Z' },
          daysUntilExpiry: { type: 'number', example: 285 },
        },
      },
    }),
    errorResponse,
  );

export const DocCheckDomain = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verificar estado del Dominio',
      description: 'Comprueba la expiración del dominio mediante WHOIS',
    }),
    healthResponse(200, 'El dominio está saludable', {
      domain: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'up' },
          expiryDate: { type: 'string', example: '2027-01-15T00:00:00Z' },
          daysUntilExpiry: { type: 'number', example: 300 },
        },
      },
    }),
    errorResponse,
  );
