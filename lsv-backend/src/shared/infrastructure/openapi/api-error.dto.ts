import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorDetailDto {
  @ApiPropertyOptional({
    description: 'Campo que falló la validación, si aplica',
    example: 'email',
  })
  field?: string;

  @ApiProperty({
    description: 'Descripción del problema en ese campo',
    example: 'email must be an email',
  })
  message: string;
}

export class ApiErrorDto {
  @ApiProperty({
    description: 'Código HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description:
      'Código de negocio estable para que un agente reintente o corrija sin parsear el texto',
    example: 'AUTH_INVALID_CREDENTIALS',
  })
  code: string;

  @ApiProperty({
    description: 'Mensaje o lista de errores de validación',
    example: 'Datos de entrada inválidos',
  })
  message: string | string[];

  @ApiPropertyOptional({
    description: 'Nombre corto del error HTTP',
    example: 'Bad Request',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'Detalle por campo (validación 400)',
    type: [ApiErrorDetailDto],
  })
  details?: ApiErrorDetailDto[];
}
