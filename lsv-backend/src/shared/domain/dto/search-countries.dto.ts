import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchCountriesDto {
  @ApiProperty({
    description: 'Nombre del país (mínimo 2 caracteres)',
    example: 'colom',
    minLength: 2,
  })
  @IsNotEmpty({ message: 'Search term is required' })
  @IsString({ message: 'Search term must be a string' })
  @MinLength(2, { message: 'Search term must be at least 2 characters long' })
  @Transform(({ value }) => value?.trim())
  name: string;
}
