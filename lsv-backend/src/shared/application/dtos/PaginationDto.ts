import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional, IsString, IsEnum } from 'class-validator';

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC',
}

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    page: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number;

    @IsOptional()
    @IsString()
    orderBy?: string;

    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.DESC;
}