import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../shared/domain/dto/PaginationDto.js';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetModeratorsDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  languageId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  regionId?: string;
}
