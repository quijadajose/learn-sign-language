import { IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OptionDto {
  @ApiProperty({ example: 'Hola' })
  @IsString()
  text: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect: boolean;
}
