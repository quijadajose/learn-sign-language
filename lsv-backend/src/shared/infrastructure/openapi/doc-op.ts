import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ApiStandardErrors } from './api-standard-errors';

export function DocOp(options: {
  summary: string;
  description?: string;
  auth?: boolean;
  body?: Type<unknown>;
  status?: number;
  okDescription?: string;
  okType?: Type<unknown>;
  okIsArray?: boolean;
  forbidden?: boolean;
  notFound?: boolean;
  conflict?: boolean;
}) {
  const status = options.status ?? 200;
  const successResponse = ApiResponse({
    status,
    description:
      options.okDescription ??
      (status === 204 ? 'Sin contenido' : 'Operación exitosa'),
    ...(status !== 204 && options.okType
      ? { type: options.okIsArray ? [options.okType] : options.okType }
      : {}),
  });

  const decorators = [
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
    successResponse,
    ApiStandardErrors({
      includeUnauthorized: options.auth !== false,
      includeForbidden: options.forbidden,
      includeNotFound: options.notFound,
      includeConflict: options.conflict,
    }),
  ];

  if (options.auth !== false) {
    decorators.unshift(ApiBearerAuth());
  }
  if (options.body) {
    decorators.push(ApiBody({ type: options.body }));
  }

  return applyDecorators(...decorators);
}
