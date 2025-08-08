import { IsArray, IsString, ValidateNested } from 'class-validator';
import { OptionDto } from '../dto/option/option-dto';
import { Type } from 'class-transformer';

export class QuestionDto {
  @IsString()
  text: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options: OptionDto[];
}
