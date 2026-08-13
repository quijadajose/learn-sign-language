import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateRegionDto } from 'src/region/domain/create-region.dto';
import { CountryWithDivisionsDto } from 'src/shared/domain/dto/country-with-divisions.dto';
import { DocOp } from 'src/shared/infrastructure/openapi/doc-op';
import {
  AssignLanguageResultDto,
  RegionListResponseDto,
  RegionResponseDto,
} from 'src/shared/infrastructure/openapi/resource-responses';

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

export const DocListRegions = () =>
  DocOp({
    summary: 'Listar regiones',
    description: 'Lista paginada. Filtro opcional languageId.',
    auth: false,
    okType: RegionListResponseDto,
  });

export const DocGetCountriesWithDivisions = () =>
  DocOp({
    summary: 'Buscar países con sus divisiones',
    auth: false,
    okType: CountryWithDivisionsDto,
    okIsArray: true,
  });

export const DocGetRegionById = () =>
  DocOp({
    summary: 'Obtener región por ID',
    auth: false,
    notFound: true,
    okType: RegionResponseDto,
  });

export const DocCreateRegion = () =>
  DocOp({
    summary: 'Crear región',
    body: CreateRegionDto,
    status: 201,
    forbidden: true,
    okType: RegionResponseDto,
  });

export const DocUpdateRegion = () =>
  DocOp({
    summary: 'Actualizar región',
    body: CreateRegionDto,
    forbidden: true,
    notFound: true,
    okType: RegionResponseDto,
  });

export const DocDeleteRegion = () =>
  DocOp({
    summary: 'Eliminar región',
    status: 204,
    forbidden: true,
    notFound: true,
  });

export const DocAssignLanguageToRegions = () =>
  DocOp({
    summary: 'Asignar lenguaje a regiones sin languageId',
    forbidden: true,
    okType: AssignLanguageResultDto,
  });
