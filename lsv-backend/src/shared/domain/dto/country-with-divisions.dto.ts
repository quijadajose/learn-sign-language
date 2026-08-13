import { ApiProperty } from '@nestjs/swagger';

export class DivisionDto {
  @ApiProperty({ example: 'CO-ANT' })
  code: string;

  @ApiProperty({ example: 'Antioquia' })
  name: string;
}

export class CountryWithDivisionsDto {
  @ApiProperty({ example: 'CO' })
  code: string;

  @ApiProperty({ example: 'Colombia' })
  name: string;

  @ApiProperty({ type: [DivisionDto] })
  divisions: DivisionDto[];
}
