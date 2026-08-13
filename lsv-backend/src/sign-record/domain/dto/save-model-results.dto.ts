import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload returned by the model trainer via BullMQ job completion.
 */
export class SaveModelResultsDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  modelId?: string;

  @ApiProperty({ example: 'https://cdn.example/model.json' })
  @IsString()
  modelJsonUrl: string;

  @ApiProperty({ type: [String], example: ['https://cdn.example/weights.bin'] })
  @IsArray()
  @IsString({ each: true })
  binUrls: string[];

  @ApiProperty({ example: 0.92, minimum: 0, maximum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  accuracy: number;

  @ApiProperty({ type: [String], example: ['hola', 'adios'] })
  @IsArray()
  @IsString({ each: true })
  labels: string[];

  @ApiPropertyOptional()
  @IsOptional()
  logs?: unknown;

  @ApiPropertyOptional({ example: 258, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  featuresCount?: number;

  @ApiPropertyOptional({ enum: ['static', 'dynamic'] })
  @IsOptional()
  @IsIn(['static', 'dynamic'])
  modelType?: 'static' | 'dynamic';

  @ApiPropertyOptional({ example: 'v1' })
  @IsOptional()
  @IsString()
  featuresSchemaVersion?: string;
}
