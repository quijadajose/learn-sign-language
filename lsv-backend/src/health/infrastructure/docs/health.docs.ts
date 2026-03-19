import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export const DocHealth = () => applyDecorators(ApiTags('Health Check'));

export const DocCheckHealth = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Verificar el estado de salud del sistema',
      description:
        'Realiza una verificación completa de los componentes del sistema (API, Base de datos, Microservicios, SSL, Dominio)',
    }),
    ApiResponse({
      status: 200,
      description: 'El sistema está saludable',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          info: {
            type: 'object',
            properties: {
              api: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'up' },
                  uptime: { type: 'number', example: 1234.56 },
                  timestamp: {
                    type: 'string',
                    example: '2026-03-19T17:15:58Z',
                  },
                  version: { type: 'string', example: '0.0.1' },
                },
              },
              database: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'up' },
                },
              },
              valkey: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'up' },
                },
              },
              ssl: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'up' },
                  expiryDate: {
                    type: 'string',
                    example: '2026-12-31T23:59:59Z',
                  },
                  daysUntilExpiry: { type: 'number', example: 285 },
                },
              },
              domain: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'up' },
                  expiryDate: {
                    type: 'string',
                    example: '2027-01-15T00:00:00Z',
                  },
                  daysUntilExpiry: { type: 'number', example: 300 },
                },
              },
            },
          },
          error: { type: 'object' },
          details: { type: 'object' },
        },
      },
    }),
    ApiResponse({
      status: 503,
      description: 'Uno o más servicios no están saludables',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          info: { type: 'object' },
          error: { type: 'object' },
          details: { type: 'object' },
        },
      },
    }),
  );
};
