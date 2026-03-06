import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

export const DocModerator = () => {
  return applyDecorators(ApiTags('Moderators'), ApiBearerAuth());
};

export const DocListModerators = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar moderadores',
      description:
        'Obtiene la lista paginada de moderadores con sus permisos. Puede filtrarse por languageId o regionId.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de moderadores obtenida exitosamente',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado',
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado - Se requiere rol de administrador',
    }),
  );
};

export const DocAssignPermission = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Asignar permiso de moderación',
      description:
        'Asigna un permiso de moderación a un usuario para un lenguaje o región específica.',
    }),
    ApiResponse({
      status: 201,
      description: 'Permiso asignado exitosamente',
    }),
    ApiResponse({
      status: 400,
      description: 'Datos de entrada inválidos',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado',
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado - Se requiere rol de administrador',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario, lenguaje o región no encontrado',
    }),
    ApiResponse({
      status: 409,
      description: 'El usuario ya tiene este permiso',
    }),
  );
};

export const DocSearchUsers = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Buscar usuarios',
      description:
        'Busca usuarios por email, nombre o apellido. Retorna hasta 10 resultados.',
    }),
    ApiQuery({
      name: 'q',
      required: true,
      description: 'Término de búsqueda (email, nombre o apellido)',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de usuarios encontrados',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado',
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado - Se requiere rol de administrador',
    }),
  );
};

export const DocRevokePermission = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Revocar permiso de moderación',
      description: 'Revoca un permiso de moderación específico.',
    }),
    ApiResponse({
      status: 200,
      description: 'Permiso revocado exitosamente',
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado',
    }),
    ApiResponse({
      status: 403,
      description: 'Acceso denegado - Se requiere rol de administrador',
    }),
    ApiResponse({
      status: 404,
      description: 'Permiso no encontrado',
    }),
  );
};
