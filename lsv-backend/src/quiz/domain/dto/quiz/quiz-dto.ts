import { ArrayMinSize, IsArray, IsString, IsUUID, ValidateNested } from 'class-validator';
import { QuestionDto } from '../../question/question-dto';
import { Type } from 'class-transformer';

export class QuizDto {
  @IsUUID()
  @IsString()
  lessonId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}
