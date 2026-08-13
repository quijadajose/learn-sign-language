import {
  ArrayMinSize,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OptionDto } from '../dto/option/option-dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QuestionDto {
  @ApiProperty({ example: '¿Cuál es la seña de hola?' })
  @IsString()
  text: string;

  @ApiProperty({ type: [OptionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options: OptionDto[];
}
