import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLessonVariantDto {
  @ApiProperty({ example: 'Variante Costa' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Variante regional de la lección' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Contenido específico de la región' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isRegionalSpecific?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isBase?: boolean;

  @ApiPropertyOptional({ example: 'Notas de uso regional' })
  @IsString()
  @IsOptional()
  regionalNotes?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  regionId: string;
}
