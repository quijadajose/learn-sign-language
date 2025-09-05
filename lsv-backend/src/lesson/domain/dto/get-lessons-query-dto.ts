import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';

export class GetLessonsQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  stageId?: string;
}
