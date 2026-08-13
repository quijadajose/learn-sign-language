import {
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOptionVariantDto {
  @ApiProperty({ example: 'Hola' })
  @IsString()
  text: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isCorrect: boolean = false;
}

export class CreateQuestionVariantDto {
  @ApiProperty({ example: '¿Cuál es la seña de hola?' })
  @IsString()
  question: string;

  @ApiProperty({ type: [CreateOptionVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionVariantDto)
  options: CreateOptionVariantDto[];
}

export class CreateQuizVariantDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  lessonVariantId: string;

  @ApiProperty({ type: [CreateQuestionVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionVariantDto)
  questions: CreateQuestionVariantDto[];
}
