import { applyDecorators } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { DivisionDto } from '../../../domain/dto/country-with-divisions.dto';
import { DocOp } from '../../openapi/doc-op';
import {
  IsoCountryDto,
  PaginatedDivisionResponseDto,
} from '../../openapi/resource-responses';

export const DocCountryDivision = () =>
  applyDecorators(ApiTags('CountryDivision'));

export const DocGetAllCountries = () =>
  DocOp({
    summary: 'Listar todos los países ISO-3166',
    auth: false,
    okType: IsoCountryDto,
    okIsArray: true,
  });

export const DocSearchDivisions = () =>
  DocOp({
    summary: 'Buscar divisiones administrativas',
    description: 'Filtros: countryCode, search, page, limit.',
    auth: false,
    okType: PaginatedDivisionResponseDto,
  });

export const DocGetAllDivisions = () =>
  DocOp({
    summary: 'Listar todas las divisiones',
    auth: false,
    okType: DivisionDto,
    okIsArray: true,
  });

export const DocGetDivisionsByCountry = () =>
  applyDecorators(
    ApiParam({ name: 'countryCode', example: 'CO' }),
    DocOp({
      summary: 'Listar divisiones de un país',
      auth: false,
      notFound: true,
      okType: DivisionDto,
      okIsArray: true,
    }),
  );
