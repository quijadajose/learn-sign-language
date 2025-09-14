import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateRegionDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  description: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
