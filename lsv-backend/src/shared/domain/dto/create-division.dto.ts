import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDivisionDto {
  @ApiProperty({ example: 'ANT', minLength: 1, maxLength: 10 })
  @IsString()
  @Length(1, 10)
  code: string;

  @ApiProperty({ example: 'Antioquia' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CO', minLength: 2, maxLength: 2 })
  @IsString()
  @Length(2, 2)
  countryCode: string;
}
