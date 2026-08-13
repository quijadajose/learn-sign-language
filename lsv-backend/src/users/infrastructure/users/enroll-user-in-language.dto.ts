import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnrollUserInLanguageDto {
  @ApiProperty({
    description: 'ID del lenguaje a inscribir',
    format: 'uuid',
    example: '8dc31a49-64ae-4c94-b867-d818ce9441e6',
  })
  @IsUUID()
  languageId: string;

  @ApiPropertyOptional({
    description: 'ID de la región (opcional)',
    format: 'uuid',
    example: 'c0a8012e-0000-4000-8000-000000000001',
  })
  @IsUUID()
  @IsOptional()
  regionId?: string;
}
