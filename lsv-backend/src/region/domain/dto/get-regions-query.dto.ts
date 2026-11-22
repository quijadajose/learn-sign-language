import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../shared/domain/dto/PaginationDto.js';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetRegionsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @IsUUID()
  languageId?: string;
}
