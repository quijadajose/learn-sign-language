import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetModeratorsDto extends PaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  languageId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  regionId?: string;
}
