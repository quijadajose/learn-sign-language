import { IsString, IsUUID, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveLandmarksDto {
  @ApiProperty({ description: 'UUID of the sign being recorded' })
  @IsUUID()
  signId: string;

  @ApiProperty({ description: 'Optional region UUID', required: false })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiProperty({ description: 'Array of landmark frames' })
  @IsArray()
  landmarks: any[];

  @ApiProperty({
    description: 'Dominant hand used',
    required: false,
    enum: ['left', 'right'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['left', 'right'])
  dominantHand?: string;
}

export class TriggerCustomTrainingDto {
  @ApiProperty({ description: 'Filter by language UUID', required: false })
  @IsOptional()
  @IsUUID()
  languageId?: string;

  @ApiProperty({ description: 'Filter by region UUID', required: false })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiProperty({ description: 'Filter by lesson UUID', required: false })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @ApiProperty({ description: 'Filter by stage UUID', required: false })
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiProperty({
    description: 'Filter by stage UUIDs',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  stageIds?: string[];

  @ApiProperty({
    description: 'Filter by sign UUIDs',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  signIds?: string[];

  @ApiProperty({ description: 'Custom name for the model', required: false })
  @IsOptional()
  @IsString()
  modelName?: string;
}

export class CreateSignDto {
  @ApiProperty({ description: 'Name of the sign' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Optional lesson UUID to associate with',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @ApiProperty({
    description: 'Whether this sign is available globally',
    required: false,
    default: false,
  })
  @IsOptional()
  isGlobal?: boolean;
}

export class UpdateSignDto {
  @ApiProperty({ description: 'New name for the sign' })
  @IsString()
  name: string;
}
