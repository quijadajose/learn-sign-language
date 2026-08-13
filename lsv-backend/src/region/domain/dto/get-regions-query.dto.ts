import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetRegionsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @IsUUID()
  languageId?: string;
}
