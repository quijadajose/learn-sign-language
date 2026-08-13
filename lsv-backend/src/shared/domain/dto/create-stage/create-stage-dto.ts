import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StageDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Nivel 1' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Etapa inicial' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ format: 'uuid' })
  @IsNotEmpty()
  @IsString()
  languageId: string;
}
