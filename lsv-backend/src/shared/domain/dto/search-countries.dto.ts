import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchCountriesDto {
  @IsNotEmpty({ message: 'Search term is required' })
  @IsString({ message: 'Search term must be a string' })
  @MinLength(2, { message: 'Search term must be at least 2 characters long' })
  @Transform(({ value }) => value?.trim())
  name: string;
}
