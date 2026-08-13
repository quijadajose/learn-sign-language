import {
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { QuestionDto } from '../../question/question-dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QuizDto {
  @ApiProperty({
    format: 'uuid',
    example: '8dc31a49-64ae-4c94-b867-d818ce9441e6',
  })
  @IsUUID()
  @IsString()
  lessonId: string;

  @ApiProperty({ type: [QuestionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}
