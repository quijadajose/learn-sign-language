import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  IsIn,
  IsBoolean,
  ArrayMinSize,
  ArrayMaxSize,
  Validate,
  ValidateNested,
  MaxLength,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FEATURES_COUNT } from '../utils/landmark-validation';

const MAX_LANDMARK_FRAMES = 600;

@ValidatorConstraint({ name: 'landmarkFrames', async: false })
export class LandmarkFramesConstraint implements ValidatorConstraintInterface {
  validate(landmarks: unknown): boolean {
    if (!Array.isArray(landmarks) || landmarks.length === 0) return false;
    if (landmarks.length > MAX_LANDMARK_FRAMES) return false;

    for (const frame of landmarks) {
      let flat: unknown;
      if (Array.isArray(frame)) {
        flat = frame;
      } else if (frame && typeof frame === 'object' && 'flat' in frame) {
        flat = (frame as { flat: unknown }).flat;
      } else {
        return false;
      }
      if (!Array.isArray(flat) || flat.length !== FEATURES_COUNT) return false;
      if (!flat.every((n) => typeof n === 'number' && Number.isFinite(n))) {
        return false;
      }
    }
    return true;
  }

  defaultMessage(_args: ValidationArguments): string {
    return `landmarks must be 1–${MAX_LANDMARK_FRAMES} frames with ${FEATURES_COUNT} numeric features each`;
  }
}

export class SaveLandmarksDto {
  @ApiProperty({ description: 'UUID of the sign being recorded' })
  @IsUUID()
  signId: string;

  @ApiProperty({ description: 'Optional region UUID', required: false })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiProperty({ description: 'Array of landmark frames (258 features each)' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_LANDMARK_FRAMES)
  @Validate(LandmarkFramesConstraint)
  landmarks: unknown[];

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
  @ApiProperty({ description: 'Filter by language UUID' })
  @IsUUID()
  languageId: string;

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
    description: 'Language UUID (required for moderator authorization)',
  })
  @IsUUID()
  languageId: string;

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
  @IsBoolean()
  isGlobal?: boolean;

  @ApiProperty({
    description: 'Capture mode: static (hold pose) or dynamic (full motion)',
    required: false,
    enum: ['static', 'dynamic'],
    default: 'static',
  })
  @IsOptional()
  @IsIn(['static', 'dynamic'])
  detectionType?: 'static' | 'dynamic';
}

export class UpdateSignDto {
  @ApiProperty({ description: 'New name for the sign', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Capture mode: static or dynamic',
    required: false,
    enum: ['static', 'dynamic'],
  })
  @IsOptional()
  @IsIn(['static', 'dynamic'])
  detectionType?: 'static' | 'dynamic';
}

export class BulkSignItemDto {
  @ApiProperty({ description: 'Name of the sign', example: 'A' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({
    description: 'Capture mode: static or dynamic',
    required: false,
    enum: ['static', 'dynamic'],
    default: 'static',
  })
  @IsOptional()
  @IsIn(['static', 'dynamic'])
  detectionType?: 'static' | 'dynamic';
}

export class CreateSignsBulkDto {
  @ApiProperty({
    description: 'Language UUID (required for moderator authorization)',
  })
  @IsUUID()
  languageId: string;

  @ApiProperty({ description: 'Lesson UUID to associate all signs with' })
  @IsUUID()
  lessonId: string;

  @ApiProperty({
    description: 'Signs to create (max 100)',
    type: [BulkSignItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BulkSignItemDto)
  signs: BulkSignItemDto[];
}
