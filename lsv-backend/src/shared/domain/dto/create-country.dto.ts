import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCountryDto {
  @ApiProperty({ example: 'CO', minLength: 2, maxLength: 2 })
  @IsString()
  @Length(2, 2)
  code: string;

  @ApiProperty({ example: 'Colombia' })
  @IsString()
  name: string;
}
