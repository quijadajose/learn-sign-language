import { IsUUID, IsOptional } from 'class-validator';

export class EnrollUserInLanguageDto {
  @IsUUID()
  languageId: string;

  @IsUUID()
  @IsOptional()
  regionId?: string;
}
