import {
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOptionVariantDto {
  @IsString()
  text: string;

  @IsBoolean()
  isCorrect: boolean = false;
}

export class CreateQuestionVariantDto {
  @IsString()
  question: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionVariantDto)
  options: CreateOptionVariantDto[];
}

export class CreateQuizVariantDto {
  @IsUUID()
  lessonVariantId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionVariantDto)
  questions: CreateQuestionVariantDto[];
}
