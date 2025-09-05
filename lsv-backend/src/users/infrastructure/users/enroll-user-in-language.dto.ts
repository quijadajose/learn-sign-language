import { IsUUID } from 'class-validator';

export class EnrollUserInLanguageDto {
  @IsUUID()
  languageId: string;
}
