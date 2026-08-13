import { IsString, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegionDto {
  @ApiProperty({ example: 'Andina' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'AND' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Región andina de Colombia' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  languageId?: string;

  @ApiPropertyOptional({ example: 'CO-ANT' })
  @IsString()
  @IsOptional()
  divisionCode?: string;
}
