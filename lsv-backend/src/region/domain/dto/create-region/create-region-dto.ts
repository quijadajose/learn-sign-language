import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegionDto {
  @ApiProperty({ example: 'Andina' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'AND' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Región andina' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
