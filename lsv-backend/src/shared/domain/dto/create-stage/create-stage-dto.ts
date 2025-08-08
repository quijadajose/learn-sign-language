import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StageDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  languageId: string;
}
