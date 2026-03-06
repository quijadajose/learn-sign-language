import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

export const DocRegion = () => applyDecorators(ApiTags('Regions'));

export const DocGetCountries = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Buscar países por nombre',
      description:
        'Busca países por nombre y retorna una lista con código y nombre del país. Útil para obtener el countryCode necesario para crear lenguajes.',
    }),
    ApiQuery({
      name: 'name',
      description: 'Nombre del país a buscar (mínimo 2 caracteres)',
      example: 'colom',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de países encontrados',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Código ISO del país',
              example: 'CO',
            },
            name: {
              type: 'string',
              description: 'Nombre del país',
              example: 'Colombia',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Parámetros de búsqueda inválidos',
    }),
  );
};
