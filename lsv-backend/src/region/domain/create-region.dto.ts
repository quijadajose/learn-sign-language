import { IsString, IsBoolean, IsOptional, IsUUID } from 'class-validator';

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

  @IsUUID()
  @IsOptional()
  languageId?: string;

  @IsString()
  @IsOptional()
  divisionCode?: string;
}
