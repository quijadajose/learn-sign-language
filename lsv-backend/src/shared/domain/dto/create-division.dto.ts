import { IsString, Length } from 'class-validator';

export class CreateDivisionDto {
  @IsString()
  @Length(1, 10)
  code: string;

  @IsString()
  name: string;

  @IsString()
  @Length(2, 2)
  countryCode: string;
}
