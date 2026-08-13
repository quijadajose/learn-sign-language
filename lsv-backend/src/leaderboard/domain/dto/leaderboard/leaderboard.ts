import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LeaderboardDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'Ana' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'García' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 1200, minimum: 0 })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  totalScore: number;
}
