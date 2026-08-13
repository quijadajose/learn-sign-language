import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetLessonsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  languageId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stageId?: string;
}
