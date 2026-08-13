import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiErrorDto } from './api-error.dto';

const errorSchema = {
  schema: { $ref: getSchemaPath(ApiErrorDto) },
};

export function ApiStandardErrors(options?: {
  includeUnauthorized?: boolean;
  includeForbidden?: boolean;
  includeNotFound?: boolean;
  includeConflict?: boolean;
}) {
  const decorators = [
    ApiExtraModels(ApiErrorDto),
    ApiResponse({
      status: 400,
      description: 'Validación o petición inválida',
      ...errorSchema,
    }),
    ApiResponse({
      status: 500,
      description: 'Error interno del servidor',
      ...errorSchema,
    }),
  ];

  if (options?.includeUnauthorized !== false) {
    decorators.push(
      ApiResponse({
        status: 401,
        description: 'No autenticado',
        ...errorSchema,
      }),
    );
  }

  if (options?.includeForbidden) {
    decorators.push(
      ApiResponse({
        status: 403,
        description: 'Sin permisos',
        ...errorSchema,
      }),
    );
  }

  if (options?.includeNotFound) {
    decorators.push(
      ApiResponse({
        status: 404,
        description: 'Recurso no encontrado',
        ...errorSchema,
      }),
    );
  }

  if (options?.includeConflict) {
    decorators.push(
      ApiResponse({
        status: 409,
        description: 'Conflicto',
        ...errorSchema,
      }),
    );
  }

  return applyDecorators(...decorators);
}
