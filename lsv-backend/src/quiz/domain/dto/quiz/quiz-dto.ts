import { IsArray, IsString, IsUUID, ValidateNested } from 'class-validator';
import { QuestionDto } from '../../question/question-dto';
import { Type } from 'class-transformer';

export class QuizDto {
  @IsUUID()
  @IsString()
  lessonId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}
