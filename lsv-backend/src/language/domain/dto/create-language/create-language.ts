import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLanguageDto {
  @ApiProperty({
    description: 'Nombre del lenguaje de señas',
    example: 'Lenguaje de señas Colombiano',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Descripción del lenguaje',
    example: 'Sistema de comunicación visual usado por la comunidad sorda.',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Código ISO del país',
    example: 'CO',
  })
  @IsOptional()
  @IsString()
  countryCode?: string;
}
