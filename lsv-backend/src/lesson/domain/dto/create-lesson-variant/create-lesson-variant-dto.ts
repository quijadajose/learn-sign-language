import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateLessonVariantDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  content: string;

  @IsBoolean()
  @IsOptional()
  isRegionalSpecific?: boolean;

  @IsBoolean()
  @IsOptional()
  isBase?: boolean;

  @IsString()
  @IsOptional()
  regionalNotes?: string;

  @IsUUID()
  regionId: string;
}
