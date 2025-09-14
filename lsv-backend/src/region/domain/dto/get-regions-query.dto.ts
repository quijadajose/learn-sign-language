import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';

export class GetRegionsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  languageId?: string;
}
