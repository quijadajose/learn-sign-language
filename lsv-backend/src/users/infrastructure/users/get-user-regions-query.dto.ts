import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';

export class GetUserRegionsQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  languageId?: string;
}
