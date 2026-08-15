import { writeFileSync } from 'fs';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ApiErrorDetailDto, ApiErrorDto } from './api-error.dto';
import { PaginationDto } from '../../domain/dto/PaginationDto';

const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

const API_DESCRIPTION = [
  'Contrato OpenAPI del backend LSV (lengua de señas).',
  '',
  'El SPA autentica con cookie httpOnly `lsv_access` (`credentials: include`).',
  'Login y Google exchange no devuelven el JWT en JSON. Clientes de prueba o el trainer pueden mandar `Authorization: Bearer <jwt>`.',
  '',
  '## Rate limit',
  'Límite por dirección IP, ventana de 60 segundos (NestJS Throttler, almacenamiento Valkey). `setHeaders` está activo por defecto.',
  '',
  '- **Global:** 100 solicitudes / 60 s',
  '- **POST /auth/register, /auth/login, /auth/password/reset, /auth/password/reset/confirm:** 5 / 60 s',
  '- **POST /auth/google/exchange:** 10 / 60 s',
  '',
  'Respuestas 2xx incluyen `X-RateLimit-Limit`, `X-RateLimit-Remaining` y `X-RateLimit-Reset` (segundos hasta que se reinicia la ventana).',
  'Si se excede el cupo: **429** con cabecera `Retry-After` (segundos) y cuerpo `ApiErrorDto`.',
  'En `NODE_ENV=test` el guard no aplica el límite (e2e comparte Valkey).',
].join('\n');

const STRICT_ROUTE_LIMITS: Record<string, number> = {
  '/auth/register': 5,
  '/auth/login': 5,
  '/auth/password/reset': 5,
  '/auth/password/reset/confirm': 5,
  '/auth/google/exchange': 10,
};

const RATE_LIMIT_SUCCESS_HEADERS = {
  'X-RateLimit-Limit': {
    $ref: '#/components/headers/X-RateLimit-Limit',
  },
  'X-RateLimit-Remaining': {
    $ref: '#/components/headers/X-RateLimit-Remaining',
  },
  'X-RateLimit-Reset': {
    $ref: '#/components/headers/X-RateLimit-Reset',
  },
};

const RATE_LIMIT_RETRY_HEADER = {
  'Retry-After': {
    $ref: '#/components/headers/Retry-After',
  },
};

export function createOpenApiConfig(serverUrl: string) {
  return new DocumentBuilder()
    .setTitle('API LSV')
    .setDescription(API_DESCRIPTION)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Opcional. JWT para clientes que no usan cookie (tests, trainer). El SPA usa la cookie httpOnly `lsv_access`.',
        in: 'header',
      },
      'bearer',
    )
    .addServer(serverUrl, 'Servidor de la API')
    .build();
}

function errorResponse(description: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiErrorDto' },
      },
    },
  };
}

function hasResponseSchema(response: unknown): boolean {
  if (!response || typeof response !== 'object') return false;
  const content = (
    response as { content?: Record<string, { schema?: unknown }> }
  ).content;
  if (!content) return false;
  return Object.values(content).some((item) => Boolean(item?.schema));
}

function ensureErrorResponse(
  responses: Record<string, unknown>,
  code: string,
  description: string,
) {
  const existing = responses[code];
  if (!existing) {
    responses[code] = errorResponse(description);
    return;
  }
  if (hasResponseSchema(existing)) return;
  const existingDescription =
    typeof existing === 'object' &&
    existing &&
    'description' in existing &&
    typeof (existing as { description: unknown }).description === 'string'
      ? (existing as { description: string }).description
      : description;
  responses[code] = errorResponse(existingDescription);
}

function humanizeOperationId(operationId: string): string {
  const withoutController = operationId.replace(/^[A-Za-z]+Controller_/, '');
  const spaced = withoutController.replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function jsonSchema(response: unknown): Record<string, unknown> | undefined {
  if (!response || typeof response !== 'object') return undefined;
  const content = (
    response as {
      content?: Record<string, { schema?: Record<string, unknown> }>;
    }
  ).content;
  const schema = content?.['application/json']?.schema;
  if (!schema || typeof schema !== 'object' || '$ref' in schema) {
    return undefined;
  }
  return schema;
}

function enrichInlineErrorSchema(response: unknown) {
  const schema = jsonSchema(response);
  if (!schema) return;
  const properties =
    schema.properties && typeof schema.properties === 'object'
      ? (schema.properties as Record<string, unknown>)
      : undefined;
  if (!properties) return;

  if (!properties.code) {
    properties.code = {
      type: 'string',
      description: 'Código de negocio estable',
      example: 'VALIDATION_ERROR',
    };
    const required = Array.isArray(schema.required) ? schema.required : [];
    if (!required.includes('code')) {
      schema.required = [...required, 'code'];
    }
  }
  if (!properties.details) {
    properties.details = {
      type: 'array',
      items: { $ref: '#/components/schemas/ApiErrorDetailDto' },
    };
  }
}

function attachResponseHeaders(
  response: unknown,
  headers: Record<string, { $ref: string }>,
) {
  if (!response || typeof response !== 'object' || '$ref' in response) {
    return;
  }
  const target = response as { headers?: Record<string, unknown> };
  target.headers = { ...headers, ...(target.headers ?? {}) };
}

function rateLimitHeaderComponents() {
  return {
    'X-RateLimit-Limit': {
      description:
        'Máximo de solicitudes permitidas en la ventana actual (100 global; 5 o 10 en rutas de auth).',
      schema: { type: 'integer', example: 100, minimum: 1 },
    },
    'X-RateLimit-Remaining': {
      description: 'Solicitudes restantes en la ventana actual.',
      schema: { type: 'integer', example: 99, minimum: 0 },
    },
    'X-RateLimit-Reset': {
      description:
        'Segundos hasta que se reinicia la ventana de rate limit (no es un timestamp Unix).',
      schema: { type: 'integer', example: 42, minimum: 0 },
    },
    'Retry-After': {
      description:
        'Segundos que el cliente debe esperar antes de reintentar tras un 429.',
      schema: { type: 'integer', example: 30, minimum: 1 },
    },
  };
}

export function applyOpenApiDefaults(document: OpenAPIObject): OpenAPIObject {
  document.components ??= {};
  document.components.schemas ??= {};
  document.components.headers = {
    ...rateLimitHeaderComponents(),
    ...(document.components.headers ?? {}),
  };

  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== 'object') continue;

      if (!operation.summary && operation.operationId) {
        operation.summary = humanizeOperationId(operation.operationId);
      }

      const routeLimit = STRICT_ROUTE_LIMITS[path];
      if (routeLimit && method === 'post') {
        const extra = `Rate limit: ${routeLimit} solicitudes / 60 s por IP.`;
        operation.description = operation.description
          ? `${operation.description}\n\n${extra}`
          : extra;
      }

      operation.responses ??= {};
      ensureErrorResponse(
        operation.responses,
        '400',
        'Validación o petición inválida',
      );
      ensureErrorResponse(
        operation.responses,
        '500',
        'Error interno del servidor',
      );
      ensureErrorResponse(
        operation.responses,
        '429',
        'Demasiadas solicitudes. Esperar Retry-After segundos y reintentar.',
      );

      const requiresAuth =
        Array.isArray(operation.security) && operation.security.length > 0;
      if (requiresAuth) {
        ensureErrorResponse(operation.responses, '401', 'No autenticado');
      }

      for (const [code, response] of Object.entries(operation.responses)) {
        if (/^[45]\d\d$/.test(code)) {
          ensureErrorResponse(operation.responses, code, `Error HTTP ${code}`);
          enrichInlineErrorSchema(operation.responses[code]);
        }
        if (/^2\d\d$/.test(code)) {
          attachResponseHeaders(response, RATE_LIMIT_SUCCESS_HEADERS);
        }
        if (code === '429') {
          attachResponseHeaders(
            operation.responses[code],
            RATE_LIMIT_RETRY_HEADER,
          );
        }
      }
    }
  }

  return document;
}

export function persistOpenApiDocument(document: OpenAPIObject): string {
  const outPath = join(process.cwd(), 'swagger.json');
  writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  return outPath;
}

export function buildOpenApiDocument(
  app: INestApplication,
  serverUrl: string,
): OpenAPIObject {
  const raw = SwaggerModule.createDocument(
    app,
    createOpenApiConfig(serverUrl),
    {
      extraModels: [ApiErrorDto, ApiErrorDetailDto, PaginationDto],
      deepScanRoutes: true,
    },
  );
  return applyOpenApiDefaults(raw);
}
