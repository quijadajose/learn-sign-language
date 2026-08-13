import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ example: 'Saludos básicos' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Lección introductoria de saludos' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'Contenido markdown de la lección' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ format: 'uuid' })
  @IsNotEmpty()
  @IsString()
  languageId: string;

  @ApiProperty({ format: 'uuid' })
  @IsNotEmpty()
  @IsString()
  stageId: string;
}
