import { IsBoolean, IsString } from 'class-validator';

export class OptionDto {
  @IsString()
  text: string;
  @IsBoolean()
  isCorrect: boolean;
}
