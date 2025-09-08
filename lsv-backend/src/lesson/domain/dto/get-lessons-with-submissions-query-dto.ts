import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { IsOptional, IsUUID } from 'class-validator';

export class GetLessonsWithSubmissionsQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  stageId?: string;
}
