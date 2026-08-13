import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartLessonDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  lessonId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  regionId?: string;
}

export class SetLessonCompletionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  lessonId: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isComplete: boolean;
}
