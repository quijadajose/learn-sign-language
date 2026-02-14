import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';

export class GetModeratorsDto extends PaginationDto {
    @IsOptional()
    @IsString()
    languageId?: string;

    @IsOptional()
    @IsString()
    regionId?: string;
}
